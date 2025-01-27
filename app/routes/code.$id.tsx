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
      <head></head>
      <body className="m-0 p-4 font-mono bg-gray-100 text-black h-full min-h-full overflow-hidden">
        <pre className="whitespace-pre-wrap break-words m-0 overflow-hidden h-full bg-gray-100">
        <button 
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => {
            // Add your button click handler here
            console.log('Button clicked');
          }}
        >
          Click Me
        </button>

          {code}
        </pre>
      </body>
    </html>
  );
}
