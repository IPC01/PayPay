# KYC document access and storage

KYC documents are private. Do not expose `uploads/kyc` through static file
serving. The application serves a document only through its authenticated KYC
routes: customers can access their own files, while administrators and
operators can access files through the admin route.

Uploads are stored outside the Git working tree. Set `UPLOADS_DIR` to an
absolute path on persistent storage before starting the server. If it is not
set, the server uses the `PayPay-data/uploads` directory beside the repository.
In production, point it to a durable volume with restricted filesystem
permissions and backups; a container's ephemeral filesystem is not sufficient.

To move files from an existing checkout to the configured storage directory,
stop the server, set `UPLOADS_DIR` if required, and run:

```powershell
cd server
node scripts/migrate-uploads.js
```

The migration verifies each file with SHA-256 before removing its source copy.
If a target file already exists with different contents, migration stops and
keeps the source file for investigation. The source `server/uploads` directory
is ignored by Git.

KYC documents have previously been committed to Git history. Removing them from
the current checkout does not erase historical copies; rewriting shared
branches requires coordination with repository collaborators and a force-push.
