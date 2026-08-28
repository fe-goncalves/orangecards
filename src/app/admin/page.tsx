import { redirect } from "next/navigation";

/** Admin em projeto/domínio separado — pasta `/admin` do monorepo. */
export default function LegacyAdminPage() {
  redirect("/");
}
