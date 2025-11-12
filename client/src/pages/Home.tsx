import Hero from '@/components/Hero'
import About from '@/pages/About'

const Home = () => {
  return (
    <div className="pb-10">
      <Hero />
      
      {/* Enhanced Feature Section */}
      <div className="py-24 px-4 bg-gradient-to-b from-transparent via-orange-50/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-orange-50 rounded-full mb-6">
              <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600"> SocApp</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to connect, share, and grow your social presence
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
              <div className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600 leading-relaxed">
                  Experience blazing fast performance with optimized code and modern infrastructure. Load times under 1 second.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
              <div className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data is protected with industry-leading security standards. Bank-level encryption guaranteed.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
              <div className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-3xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Beautiful Design</h3>
                <p className="text-gray-600 leading-relaxed">
                  Clean, intuitive interface that's a joy to use every day. Designed with care and attention to detail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <About />
    </div>
  )
}

export default Home