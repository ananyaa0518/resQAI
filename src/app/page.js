import Link from "next/link";
import Image from "next/image";


export default function Home() {
  return (
    <main>
      <section className="relative isolate overflow-hidden py-24 sm:py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="ResQAI Logo"
                width={80}
                height={80}
                className="rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-gray-900">
              Report Emergencies, Save Lives.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Share critical information in seconds. Authorities see it
              instantly on the live dashboard with AI-powered disaster classification.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/report"
                className="rounded-lg bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Report an Emergency
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                View Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-lg border p-6">
              <div className="h-10 w-10 rounded bg-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Report</h3>
              <p className="text-gray-600">
                Select your location, describe the emergency, and optionally add
                images.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="h-10 w-10 rounded bg-green-600 mb-4" />
              <h3 className="font-semibold mb-2">Classify</h3>
              <p className="text-gray-600">
                AI-assisted triage helps prioritize and route reports in
                real-time.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="h-10 w-10 rounded bg-orange-600 mb-4" />
              <h3 className="font-semibold mb-2">Rescue</h3>
              <p className="text-gray-600">
                Responders view incidents on the dashboard and coordinate rapid
                response.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
