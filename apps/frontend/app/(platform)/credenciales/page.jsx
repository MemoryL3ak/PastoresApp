"use client";

import CredentialTemplates from "@/components/CredentialTemplates";
import RoleGuard from "@/components/RoleGuard";

export default function CredencialesPage() {
  return (
    <RoleGuard allowed={["admin", "country_assigned"]}>
      <div>
        <h2 className="view-title">Gestion de credenciales</h2>
        <CredentialTemplates />
      </div>
    </RoleGuard>
  );
}
