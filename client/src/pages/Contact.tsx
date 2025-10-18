import React, { useState } from 'react'
import { toast } from "react-toastify"

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    toast.success("Message sent!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="bg-white py-10 px-6 flex flex-col items-center" id="contact">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Contact <span className="text-orange-400">Us</span>
      </h2>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-gray-50 p-8 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.35)] space-y-6"
      >
        <div>
          <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-gray-700 mb-2 font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Write your message..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none resize-none"
          ></textarea>
        </div>
        <div className=' text-center'>
          <button
          type="submit"
          className=" w-2/4 bg-orange-400 text-white font-semibold py-3 rounded-lg hover:bg-orange-500 transition"
        >
          Send Message
          </button>
        </div>
      </form>
    </div>
  );
};

export default Contact
