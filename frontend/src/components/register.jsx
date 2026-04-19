import { useState } from "react";

const categories = [
  "Community", "Environment", "Health", "Education",
  "Technology", "Culture", "Sports", "Safety", "Other"
];

const statusOptions = ["approved", "pending", "rejected"];

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    organiser: "",
    location_name: "",
    start_at: "",
    end_at: "",
    status: "approved",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg }
  const [step, setStep] = useState(1); // 1 = details, 2 = location & time

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      organiser: form.organiser,
      location_name: form.location_name,
      start_at: form.start_at,
      end_at: form.end_at,
      status: form.status,
    };

    try {
      const res = await fetch("https://urbaneye-jepe.onrender.com/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      showToast("success", "Event registered successfully!");
      setForm({
        name: "", description: "", category: "", organiser: "",
        location_name: "", start_at: "", end_at: "", status: "approved",
      });
      setStep(1);
    } catch (err) {
      showToast("error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = form.name && form.organiser && form.category;
  const isStep2Valid = form.location_name && form.start_at && form.end_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center px-4 py-12 font-sans">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-blue-600 font-semibold mb-3">
            UrbanEye
          </span>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            Register an Event
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Submit a city event for review and discovery
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 px-1">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <button
                onClick={() => s === 2 && isStep1Valid ? setStep(s) : s === 1 && setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0
                  ${step === s
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : step > s
                    ? "bg-blue-100 text-blue-600 border border-blue-300"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
              >
                {step > s ? "✓" : s}
              </button>
              <span className={`text-sm font-medium ${step === s ? "text-slate-800" : "text-slate-400"}`}>
                {s === 1 ? "Event Details" : "Location & Time"}
              </span>
              {s < 2 && <div className={`flex-1 h-px ${step > 1 ? "bg-blue-200" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">

          <form onSubmit={handleSubmit}>

            {/* STEP 1 */}
            {step === 1 && (
              <div className="p-8 space-y-5">
                <Field label="Event Name" required>
                  <Input
                    name="name" value={form.name}
                    onChange={handleChange} placeholder="e.g. Tree Plantation Drive"
                    required
                  />
                </Field>

                <Field label="Organiser" required>
                  <Input
                    name="organiser" value={form.organiser}
                    onChange={handleChange} placeholder="e.g. Green Hyderabad NGO"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category" required>
                    <select
                      name="category" value={form.category}
                      onChange={handleChange} required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Status">
                    <select
                      name="status" value={form.status}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    name="description" value={form.description}
                    onChange={handleChange} rows={3}
                    placeholder="Briefly describe the event..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none placeholder-slate-400"
                  />
                </Field>

                <button
                  type="button"
                  disabled={!isStep1Valid}
                  onClick={() => setStep(2)}
                  className="w-full mt-2 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
                    bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Continue → Location & Time
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="p-8 space-y-5">
                <Field label="Location Name" required>
                  <Input
                    name="location_name" value={form.location_name}
                    onChange={handleChange} placeholder="e.g. Hussain Sagar Lake, Hyderabad"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Starts At" required>
                    <Input
                      name="start_at" type="datetime-local"
                      value={form.start_at} onChange={handleChange} required
                    />
                  </Field>
                  <Field label="Ends At" required>
                    <Input
                      name="end_at" type="datetime-local"
                      value={form.end_at} onChange={handleChange}
                      min={form.start_at} required
                    />
                  </Field>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !isStep2Valid}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
                      bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                      flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Registering…
                      </>
                    ) : (
                      "Register Event ✓"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300
            ${toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
            }`}>
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Field wrapper
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// Reusable Input
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition placeholder-slate-400
        ${className}`}
    />
  );
}