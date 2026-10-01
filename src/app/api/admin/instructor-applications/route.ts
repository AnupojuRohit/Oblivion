import { fail, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { InstructorApplication } from "@/modules/instructor/instructor-application.model";
import { User } from "@/modules/auth/user.model";
import { AppError } from "@/lib/errors/app-error";
import { z } from "zod";
const decision=z.object({applicationId:z.string().regex(/^[a-f\d]{24}$/i),decision:z.enum(["APPROVE","REJECT"])});
export async function GET(){try{await requireAdmin();await connectToDatabase();return ok(await InstructorApplication.find().populate("userId","name email role").sort({createdAt:-1}).lean());}catch(error){return fail(error);}}
export async function PATCH(request:Request){try{await requireAdmin();await connectToDatabase();const input=decision.parse(await request.json());const application=await InstructorApplication.findById(input.applicationId);if(!application)throw new AppError("APPLICATION_NOT_FOUND","Application not found",404);application.status=input.decision==="APPROVE"?"APPROVED":"REJECTED";application.reviewedAt=new Date();await application.save();if(input.decision==="APPROVE")await User.updateOne({_id:application.userId},{$set:{role:"INSTRUCTOR"}});return ok({status:application.status});}catch(error){return fail(error);}}