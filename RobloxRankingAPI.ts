import { OpenCloud, GroupMembershipRole, GroupRole } from "@relatiohq/opencloud";

// --- Configuration ---
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const TARGET_GROUP_ID = process.env.ROBLOX_GROUP_ID;

if (!ROBLOX_API_KEY || !TARGET_GROUP_ID) {
    console.error("CRITICAL CONFIG: ROBLOX_API_KEY and ROBLOX_GROUP_ID environment variables must be set.");
}

// --- SDK Initialization ---
const client = new OpenCloud({
    apiKey: ROBLOX_API_KEY,
});

let cachedGroupRoles: GroupRole[] | null = null;

/**
 * Fetches all roles for the target group and caches them.
 * This function uses the Relatio SDK wrapper.
 */
async function fetchAndCacheGroupRoles(): Promise<GroupRole[]> {
    if (!TARGET_GROUP_ID) {
        throw new Error("Cannot fetch roles: Target Group ID is missing.");
    }
    if (cachedGroupRoles) {
        return cachedGroupRoles;
    }

    try {
        const rolesResponse = await client.groups.listGroupRoles(TARGET_GROUP_ID, {});
        
        cachedGroupRoles = rolesResponse.roles;
        return cachedGroupRoles;
    } catch (e) {
        console.error("Error fetching group roles:", e);
        throw new Error("Failed to initialize group roles data from Roblox Open Cloud.");
    }
}

/**
 * Looks up the full Role ID path based on the numeric rank value.
 */
async function getRoleFromRankValue(rankValue: number): Promise<string> {
    const roles = await fetchAndCacheGroupRoles();

    const targetRole = roles.find(role => role.rank === rankValue);

    if (!targetRole) {
        throw new Error(`Rank value ${rankValue} is invalid or not configured in group ${TARGET_GROUP_ID}.`);
    }

    return targetRole.name;
}

/**
 * Public high-level function to update a user's rank using a numeric rank value (0-255).
 * This function handles the rank-to-role translation internally.
 */
export async function setRankByRankValue(userId: string, rankValue: number): Promise<GroupMembershipRole> {
    if (rankValue < 0 || rankValue > 255) {
        throw new Error("Invalid rank value. Must be between 0 and 255.");
    }

    const targetRolePath = await getRoleFromRankValue(rankValue);

    return updateGroupRank(userId, targetRolePath);
}


/**
 * Core function: Updates a specific user's role within a Roblox group using the full Role ID path.
 * This function uses the Relatio SDK wrapper.
 */
export async function updateGroupRank(userId: string, roleId: string): Promise<GroupMembershipRole> {
    if (!TARGET_GROUP_ID) {
        throw new Error("Ranking configuration failed: Target Group ID is missing.");
    }
    
    try {
        const response = await client.groups.updateGroupMembership(
            TARGET_GROUP_ID,
            userId,
            { role: roleId }
        );

        return response.role;

    } catch (error) {
        console.error(`❌ Failed to update rank for user ${userId}:`, error);
        throw new Error(`Ranking operation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
