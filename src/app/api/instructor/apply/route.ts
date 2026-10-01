import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { InstructorApplication } from "@/modules/instructor/instructor-application.model";
import { z } from "zod";\nimport { AppError } from "@/lib/errors/app-error";
const schema=z.object({bio:z.string().trim().min(30).max(2000),expertise:z.string().trim().min(2).max(500)});
export async function GET(){try{const user=await requireUser();await connectToDatabase();const application=await InstructorApplication.findOne({userId:user.id}).lean();return ok(application);}catch(error){return fail(error);}}
export async function POST(request:Request){try{const user=await requireUser();if(user.role!=="STUDENT")throw new AppError("FORBIDDEN","Only student accounts can apply to become instructors",403);await connectToDatabase();const input=schema.parse(await request.json());const existing=await InstructorApplication.findOne({userId:user.id});if(existing&&existing.status==="PENDING")throw new AppError("APPLICATION_PENDING","You already have a pending instructor application",409);const application=await InstructorApplication.findOneAndUpdate({userId:user.id},{$set:{...input,status:"PENDING",reviewedAt:null}},{upsert:true,new:true,setDefaultsOnInsert:true});return ok(application,201);}catch(error){return fail(error);}}