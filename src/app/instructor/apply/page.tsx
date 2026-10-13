import { redirect } from "next/navigation";

export default async function InstructorApplyPage() {
  redirect("/dashboard/courses/new");
}