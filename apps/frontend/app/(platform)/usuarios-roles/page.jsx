import UsersRolesModule from "@/modules/users/UsersRolesModule";
import RoleGuard from "@/components/RoleGuard";

export default function UsersRolesPage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <UsersRolesModule />
    </RoleGuard>
  );
}
