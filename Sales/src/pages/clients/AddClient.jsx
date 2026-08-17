import { useState } from "react";

import toast from "react-hot-toast";

import { createClient } from "../../services/clientService";

export default function AddClient() {
  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [form, setForm] = useState({
    company_name: "",
    client_name: "",
    email: "",
    phone: "",
    business_address: "",
    gst_number: "",
    website: "",
    company_description: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createClient(form);

      toast.success(
        "Client created successfully"
      );

      setForm({
        company_name: "",
        client_name: "",
        email: "",
        phone: "",
        business_address: "",
        gst_number: "",
        website: "",
        company_description: "",
        password: "",
      });
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to create client"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Add Client
          </h1>

          <p className="text-gray-500 mt-2">
            Create a new client account
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* COMPANY */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Company Name
            </label>

            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* CLIENT NAME */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Client Name
            </label>

            <input
              type="text"
              name="client_name"
              value={form.client_name}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Phone
            </label>

            <input
              type="number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* GST */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              GST Number
            </label>

            <input
              type="text"
              name="gst_number"
              value={form.gst_number}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* WEBSITE */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Website
            </label>

            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* PASSWORD */}
          <div className="md:col-span-2 relative">
            <label className="text-sm font-medium text-gray-600">
              Client Login Password
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            //   required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((p) => !p)
              }
              className="absolute right-4 top-[44px] text-xs font-semibold text-indigo-600"
            >
              {showPassword
                ? "HIDE"
                : "SHOW"}
            </button>
          </div>

          {/* ADDRESS */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">
              Business Address
            </label>

            <textarea
              rows={3}
              name="business_address"
              value={form.business_address}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">
              Company Description
            </label>

            <textarea
              rows={4}
              name="company_description"
              value={
                form.company_description
              }
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* BUTTON */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold"
            >
              {loading
                ? "Creating..."
                : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}