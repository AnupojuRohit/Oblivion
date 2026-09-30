# Storage and uploads

Course resources use a provider-neutral storage interface: `save`, `delete`, and `getSignedUrl`. The current adapter is S3-compatible, so it works with managed object stores such as Cloudflare R2 without coupling course services to that vendor.

An instructor first requests a five-minute presigned upload URL. The server checks the instructor owns the course, validates the lesson, file metadata, MIME type, and 10 MB limit, then creates a scoped object key. The browser uploads directly to object storage and registers the completed upload in MongoDB. The application never accepts a course file body on its own server.

Allowed types are PDF, PPT/PPTX, DOC/DOCX, and ZIP. Course-resource records contain metadata and a private storage key—not a permanent public URL. Download links are short-lived signed GET URLs and remain restricted to an authorized course owner/admin until learner enrollment access is added in the learning/payment phases.

Configure your bucket CORS to allow browser `PUT` requests from `NEXT_PUBLIC_APP_URL`, with `Content-Type` allowed. Set `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_BUCKET` in the deployment environment.
