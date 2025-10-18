import React from "react";
import Sidebar from "../components/Sidebar";

const Dashboard: React.FC = () => {
  const posts = [
    { id: 1, title: "First Post", content: "This is my first post on Mini Social!" },
    { id: 2, title: "Good Morning!", content: "Have a productive and happy day!" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content should always be visible */}
      <main className="flex-1 p-8 ml-0 md:ml-64 transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-blue-600">{post.title}</h2>
              <p className="text-gray-700 mt-2">{post.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
