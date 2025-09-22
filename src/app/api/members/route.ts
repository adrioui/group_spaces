import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { spaceMembers, users, spaces } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Helper function to extract userId from auth (placeholder)
function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new Error('Authentication required');
  return userId;
}

// Helper function to check space membership and role
async function checkSpaceMembership(userId: string, spaceId: number): Promise<{ isMember: boolean; role?: string }> {
  const membership = await db
    .select({ role: spaceMembers.role })
    .from(spaceMembers)
    .where(
      and(
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.status, 'active')
      )
    )
    .limit(1);
  
  return membership.length > 0 ? { isMember: true, role: membership[0].role } : { isMember: false };
}

// GET - List members of a space
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    if (!spaceId || isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Valid space ID is required",
        code: "MISSING_SPACE_ID"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    // Check if user has access to this space
    const { isMember } = await checkSpaceMembership(userId, spaceIdNum);
    if (!isMember) {
      return NextResponse.json({ 
        error: "Access denied", 
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    // Get all members with user details
    const members = await db
      .select({
        membershipId: spaceMembers.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatarUrl,
        role: spaceMembers.role,
        status: spaceMembers.status,
        joinedAt: spaceMembers.createdAt,
      })
      .from(spaceMembers)
      .innerJoin(users, eq(spaceMembers.userId, users.id))
      .where(eq(spaceMembers.spaceId, spaceIdNum))
      .orderBy(
        // Order by role priority (owner first, then admin, then member)
        asc(
          // Custom ordering: owner=1, admin=2, member=3
          spaceMembers.role
        ),
        asc(users.name)
      );

    // Sort manually by role priority
    const sortedMembers = members.sort((a, b) => {
      const roleOrder = { owner: 1, admin: 2, member: 3 };
      return roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder];
    });

    return NextResponse.json(sortedMembers);
  } catch (error) {
    console.error('GET members error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST - Invite user to space
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { spaceId, email, role = 'member' } = await request.json();

    if (!spaceId || !email || !role) {
      return NextResponse.json({ 
        error: "Space ID, email, and role are required", 
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Invalid space ID",
        code: "INVALID_SPACE_ID"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    if (!['member', 'admin'].includes(role)) {
      return NextResponse.json({
        error: "Role must be 'member' or 'admin'",
        code: "INVALID_ROLE"
      }, { status: 400 });
    }

    // Check if user has admin/owner permissions
    const { isMember, role: userRole } = await checkSpaceMembership(userId, spaceIdNum);
    if (!isMember || !['admin', 'owner'].includes(userRole!)) {
      return NextResponse.json({ 
        error: "Permission denied. Only admins and owners can invite users.", 
        code: "INSUFFICIENT_PERMISSIONS" 
      }, { status: 403 });
    }

    // Find user by email
    const inviteeUser = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (inviteeUser.length === 0) {
      return NextResponse.json({ 
        error: "User not found with this email", 
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const inviteeId = inviteeUser[0].id;

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(spaceMembers)
      .where(
        and(
          eq(spaceMembers.spaceId, spaceIdNum),
          eq(spaceMembers.userId, inviteeId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({ 
        error: "User is already a member of this space", 
        code: "ALREADY_MEMBER" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create invitation
    const invitation = await db.insert(spaceMembers).values({
      spaceId: spaceIdNum,
      userId: inviteeId,
      role: role,
      status: 'invited',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      message: `Invitation sent to ${email}`,
      invitation: {
        ...invitation[0],
        inviteeName: inviteeUser[0].name,
        inviteeEmail: email,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST members error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// PUT - Change member role or accept invitation
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'changeRole' or 'acceptInvite'

    if (action === 'acceptInvite') {
      // Accept invitation
      const { spaceId } = await request.json();

      if (!spaceId || isNaN(parseInt(spaceId))) {
        return NextResponse.json({
          error: "Valid space ID is required",
          code: "INVALID_SPACE_ID"
        }, { status: 400 });
      }

      const spaceIdNum = parseInt(spaceId);

      // Find user's invitation
      const invitation = await db
        .select()
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceIdNum),
            eq(spaceMembers.userId, userId),
            eq(spaceMembers.status, 'invited')
          )
        )
        .limit(1);

      if (invitation.length === 0) {
        return NextResponse.json({ 
          error: "No invitation found", 
          code: "INVITATION_NOT_FOUND" 
        }, { status: 404 });
      }

      // Accept invitation
      const updatedMembership = await db
        .update(spaceMembers)
        .set({
          status: 'active',
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(spaceMembers.spaceId, spaceIdNum),
            eq(spaceMembers.userId, userId)
          )
        )
        .returning();

      return NextResponse.json({
        message: "Invitation accepted successfully",
        membership: updatedMembership[0]
      });
    } else {
      // Change member role
      const { spaceId, targetUserId, newRole } = await request.json();

      if (!spaceId || !targetUserId || !newRole) {
        return NextResponse.json({ 
          error: "Space ID, target user ID, and new role are required", 
          code: "MISSING_REQUIRED_FIELDS" 
        }, { status: 400 });
      }

      if (!['member', 'admin'].includes(newRole)) {
        return NextResponse.json({
          error: "Role must be 'member' or 'admin'",
          code: "INVALID_ROLE"
        }, { status: 400 });
      }

      const spaceIdNum = parseInt(spaceId);

      // Check if user has owner permissions
      const { isMember, role: userRole } = await checkSpaceMembership(userId, spaceIdNum);
      if (!isMember || userRole !== 'owner') {
        return NextResponse.json({ 
          error: "Permission denied. Only space owners can change member roles.", 
          code: "INSUFFICIENT_PERMISSIONS" 
        }, { status: 403 });
      }

      // Cannot change owner role
      const targetMembership = await db
        .select()
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceIdNum),
            eq(spaceMembers.userId, targetUserId)
          )
        )
        .limit(1);

      if (targetMembership.length === 0) {
        return NextResponse.json({ 
          error: "Target user is not a member of this space", 
          code: "USER_NOT_MEMBER" 
        }, { status: 404 });
      }

      if (targetMembership[0].role === 'owner') {
        return NextResponse.json({ 
          error: "Cannot change owner role", 
          code: "CANNOT_CHANGE_OWNER" 
        }, { status: 400 });
      }

      // Update role
      const updatedMembership = await db
        .update(spaceMembers)
        .set({
          role: newRole,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(spaceMembers.spaceId, spaceIdNum),
            eq(spaceMembers.userId, targetUserId)
          )
        )
        .returning();

      return NextResponse.json({
        message: `Role updated to ${newRole}`,
        membership: updatedMembership[0]
      });
    }
  } catch (error) {
    console.error('PUT members error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// DELETE - Remove member from space
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const targetUserId = searchParams.get('userId');

    if (!spaceId || !targetUserId) {
      return NextResponse.json({
        error: "Space ID and user ID are required",
        code: "MISSING_PARAMETERS"
      }, { status: 400 });
    }

    if (isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Invalid space ID",
        code: "INVALID_PARAMETERS"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    // Check if user has admin/owner permissions
    const { isMember, role: userRole } = await checkSpaceMembership(userId, spaceIdNum);
    if (!isMember || !['admin', 'owner'].includes(userRole!)) {
      return NextResponse.json({ 
        error: "Permission denied", 
        code: "INSUFFICIENT_PERMISSIONS" 
      }, { status: 403 });
    }

    // Get target user membership
    const targetMembership = await db
      .select()
      .from(spaceMembers)
      .where(
        and(
          eq(spaceMembers.spaceId, spaceIdNum),
          eq(spaceMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (targetMembership.length === 0) {
      return NextResponse.json({ 
        error: "User is not a member of this space", 
        code: "USER_NOT_MEMBER" 
      }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMembership[0].role === 'owner') {
      return NextResponse.json({ 
        error: "Cannot remove space owner", 
        code: "CANNOT_REMOVE_OWNER" 
      }, { status: 400 });
    }

    // Update status to 'left' instead of deleting
    await db
      .update(spaceMembers)
      .set({
        status: 'left',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(spaceMembers.spaceId, spaceIdNum),
          eq(spaceMembers.userId, targetUserId)
        )
      );

    return NextResponse.json({
      message: "Member removed from space successfully",
      removedUserId: targetUserId
    });
  } catch (error) {
    console.error('DELETE members error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
