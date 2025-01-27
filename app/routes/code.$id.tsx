import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  // Decode the base64 ID to get the code content
  const code = decodeURIComponent(atob(id));

  return json({ code });
}

export default function CodeDisplay() {
  const { code } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <style>{`
          body { 
            margin: 0; 
            padding: 16px; 
            font-family: monospace; 
            background: #efefef;
            color: black;
          }
          pre { 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            margin: 0;
          }
        `}</style>
      </head>
      <body>
        <pre>{code}</pre>
      </body>
    </html>
  );
}
