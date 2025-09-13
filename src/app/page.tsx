import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  
  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Professional{' '}
            <span className="relative whitespace-nowrap text-blue-600">
              <span className="relative">Invoice</span>
            </span>{' '}
            Generation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Create, manage, and send professional invoices with ease. Generate PDF invoices, track payments, and manage your clients all in one place.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/sign-up"
              className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 text-white hover:text-slate-100 hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 focus-visible:outline-blue-600"
            >
              Get started for free
            </Link>
            <Link
              href="/sign-in"
              className="group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300"
            >
              Sign in
            </Link>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Professional Templates
              </h3>
              <p className="text-gray-600">
                Beautiful, customizable invoice templates that make your business look professional.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Fast PDF Generation
              </h3>
              <p className="text-gray-600">
                Generate professional PDF invoices instantly with automatic calculations and formatting.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Track & Manage
              </h3>
              <p className="text-gray-600">
                Keep track of all your invoices, payments, and clients in one organized dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
