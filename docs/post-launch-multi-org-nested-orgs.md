# Post-Launch Development: Multi-Org Membership & Nested Organizations

**Created:** January 21, 2026  
**Status:** Post-Launch Enhancement  
**Priority:** Enterprise Sales Enablement

---

## Background Discussion

During development of the mutual-initiation transfer request system, we identified a limitation in the current single-organization-per-teacher architecture.

### Current Architecture (Launch)
- Each teacher belongs to **one organization only**
- `profiles.organization_id` is a single foreign key
- Transfer means leaving one org to join another

### Real-World Use Case Identified

**Scenario:** A pastor (Org Manager) has an age group minister (Teacher) who needs to establish an organization for 3 teachers in that age group.

```
First Baptist Church (Pastor = Org Manager)
    └── Children's Ministry (Age Group Minister = ???)
            ├── Teacher 1
            ├── Teacher 2
            └── Teacher 3
```

**Problem:** How does the Age Group Minister:
1. Remain connected to the Pastor's organization
2. Become Org Manager of their own sub-organization for 3 teachers

---

## Option A: Multi-Org Membership (Deferred)

Allow teachers to belong to multiple organizations simultaneously.

### Architecture Changes Required
- Create junction table: `organization_members`
  - `id` (uuid)
  - `user_id` (uuid → profiles)
  - `organization_id` (uuid → organizations)
  - `role` (enum: member, manager)
  - `is_primary` (boolean)
  - `joined_at` (timestamp)
- Remove `organization_id` and `organization_role` from `profiles`
- Update all queries that reference org membership

### Design Questions to Resolve
1. **Primary Organization** - Which org's branding/focus set shows by default?
2. **Roles Per Org** - Can someone be Member at Org A and Manager at Org B?
3. **Subscription Implications** - Does subscription attach to user or org?

### "Transfer" Becomes Multiple Actions
- **Add to org** - Join an additional organization
- **Remove from org** - Leave one org (may still be in others)
- **True transfer** - Leave Org A specifically to join Org B

**Decision:** Deferred. Too complex for January 27 launch.

---

## Option B: Nested Organizations (Recommended Post-Launch)

Create explicit parent-child relationships between organizations.

### Architecture Changes Required
- Add `parent_organization_id` (uuid, nullable) to `organizations` table
- Add `hierarchy_level` (integer) for depth tracking
- Create RLS policies for hierarchical access

### Example Structure
```
Baptist General Convention of Texas
    └── Dallas Baptist Association
            └── First Baptist Church Dallas
                    ├── Children's Ministry
                    ├── Youth Ministry
                    └── Adult Ministry
```

### Benefits
- Supports enterprise sales to Conventions and Associations
- Clear authority chain
- White-label branding can cascade down hierarchy
- Shared focus sets can be inherited from parent
- Reporting can roll up to parent organizations

### User Experience
- Org Manager creates "child organization" under their current org
- They can assign another member as Manager of the child org
- That person remains visible in the parent org's member list
- Or they can manage the child org themselves while remaining a member of parent

---

## Launch Decision (January 27, 2026)

**Use simple workaround:**
- Age Group Minister creates separate organization: "First Baptist - Children's Ministry"
- They transfer out of Pastor's org to become Org Manager of their own
- The relationship to the main church is understood but not enforced by system

**Post-launch:** Implement Option B (Nested Organizations) for enterprise customers.

---

## Implementation Priority

| Phase | Feature | Target |
|-------|---------|--------|
| Launch | Single-org membership | January 27, 2026 |
| Phase 2 | Nested Organizations | Q1 2026 |
| Phase 3 | Multi-Org Membership (if needed) | TBD |

---

## Related Files
- `src/constants/transferRequestConfig.ts` - Transfer request SSOT
- `src/components/admin/TransferRequestQueue.tsx` - Admin transfer processing
- `src/components/admin/TransferRequestForm.tsx` - Org Manager transfer form
- Database table: `organizations`
- Database table: `profiles` (contains `organization_id`)

---

## Notes
- Nested organizations will be valuable for enterprise sales to Baptist Conventions
- Consider how shared focus sets inherit through hierarchy
- Consider how white-label branding cascades to child organizations
- RLS policies will need careful design for hierarchical access
