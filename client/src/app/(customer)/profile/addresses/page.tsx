import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AddressesRedirectPage() {
  redirect(ROUTES.addresses);
}
