import React, { useState } from 'react'
import { toast } from "react-toastify"
import axios from 'axios'

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://26.176.162.130:8080/api/contact', formData);
      toast.success(response.data.message || "Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error('Contact Error:', error);
      toast.error(error.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20" id="contact">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 bg-orange-50 rounded-full mb-6">
            <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Get In Touch</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Let's Start a 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600"> Conversation</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Send us a message 
            and we'll respond as soon as possible.
          </p>
        </div>

        {/* Form with glassmorphism */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-2xl border border-orange-100 space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 bg-white"
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 bg-white"
                disabled={loading}
              />
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Tell us what's on your mind..."
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none resize-none transition-all duration-200 bg-white"
              disabled={loading}
              minLength={3}
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Message →'
              )}
            </button>
          </div>
        </form>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">📧</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
            <p className="text-sm text-gray-600">baykatv5@gmail.com</p>
          </div>
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">📱</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
            <p className="text-sm text-gray-600">+7 (707) 452 0847</p>
          </div>
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">📍</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Visit Us</h3>
            <p className="text-sm text-gray-600">Kazakhstan, Astana</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact