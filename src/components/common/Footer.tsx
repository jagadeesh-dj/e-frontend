import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin,
  Heart, Shield, Truck, Award, CreditCard, Globe, ArrowUpRight
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const footerLinks = {
  recipient: [
    { name: 'For Her', href: '/products?recipient=her' },
    { name: 'For Him', href: '/products?recipient=him' },
    { name: 'For Girls', href: '/products?recipient=girls' },
    { name: 'For Boys', href: '/products?recipient=boys' },
    { name: 'For Couples', href: '/products?recipient=couples' },
    { name: 'For Kids', href: '/products?recipient=kids' },
  ],
  relationship: [
    { name: 'For Husband', href: '/products?recipient=husband' },
    { name: 'For Wife', href: '/products?recipient=wife' },
    { name: 'For Parents', href: '/products?recipient=parents' },
    { name: 'For Siblings', href: '/products?recipient=siblings' },
    { name: 'For Friends', href: '/products?recipient=friends' },
    { name: 'For Colleagues', href: '/products?recipient=colleagues' },
  ],
  category: [
    { name: 'Cakes', href: '/products?category=cakes' },
    { name: 'Flowers', href: '/products?category=flowers' },
    { name: 'Plants', href: '/products?category=plants' },
    { name: 'Personalized', href: '/products?category=personalized' },
    { name: 'Combos', href: '/products?category=combos' },
    { name: 'Chocolates', href: '/products?category=chocolates' },
  ],
  occasions: [
    { name: 'Birthday', href: '/products?occasion=birthday' },
    { name: 'Anniversary', href: '/products?occasion=anniversary' },
    { name: "Valentine's Day", href: '/products?occasion=valentine' },
    { name: 'Wedding', href: '/products?occasion=wedding' },
    { name: 'Women\'s Day', href: '/products?occasion=womens-day' },
    { name: 'Housewarming', href: '/products?occasion=housewarming' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Order', href: '/orders' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Blogs', href: '/blog' },
    { name: 'Careers', href: '/careers' },
  ],
}

const features = [
  { icon: Truck, title: 'Same Day Delivery', desc: 'Across 400+ Cities' },
  { icon: Shield, title: 'Secure Payment', desc: '100% Safe Transitions' },
  { icon: Award, title: 'Quality Guaranteed', desc: 'Freshness & Excellence' },
  { icon: Heart, title: '24/7 Support', desc: 'We are here to help' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      {/* Newsletter Section - Premium Integration */}
      <div className="bg-amber-50/50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center lg:text-left">
              <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Join our Premium Circle</h3>
              <p className="text-gray-600 font-medium">Get exclusive access to secret collections, early launches, and daily gifting inspiration.</p>
            </div>
            <form className="w-full max-w-md">
              <div className="flex flex-col sm:flex-row gap-3 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-amber-400 transition-all">
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent px-5 py-3.5 text-sm focus:outline-none"
                />
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 h-12 shadow-md">
                  Subscribe
                </Button>
              </div>
              <p className="mt-3 text-[10px] text-gray-400 text-center lg:text-left">By subscribing, you agree to our Privacy Policy and Terms of Service.</p>
            </form>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-500 font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link to="/" className="inline-block mb-8">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800 tracking-tight">
                ShopVista
              </span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Premium Gifting</p>
            </Link>
            
            <p className="text-gray-500 mb-8 text-sm leading-relaxed max-w-sm">
              Crafting unforgettable moments since 2012. We are India's leading premium gifting destination, bringing you curated excellence with a touch of elegance.
            </p>

            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-widest">Occasions</h4>
            <ul className="space-y-4">
              {footerLinks.occasions.slice(0, 6).map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-gray-500 hover:text-amber-600 transition-colors text-sm font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-widest">Gifts By</h4>
            <ul className="space-y-4">
              {footerLinks.recipient.slice(0, 6).map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-gray-500 hover:text-amber-600 transition-colors text-sm font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-gray-500 hover:text-amber-600 transition-colors text-sm font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-widest">Help</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Shipping Policy', 'Refund Policy', 'Contact Support', 'FAQs', 'Sitemap'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-gray-500 hover:text-amber-600 transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Global Presence & Payment */}
      <div className="bg-gray-50/50 border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>USA</span>
              <span className="text-gray-200">/</span>
              <span>UK</span>
              <span className="text-gray-200">/</span>
              <span>Canada</span>
              <span className="text-gray-200">/</span>
              <span>Australia</span>
              <span className="text-gray-200">/</span>
              <span>Europe</span>
              <span className="text-gray-200">/</span>
              <span>UAE</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex gap-2 opacity-60">
                {['Visa', 'Mastercard', 'UPI', 'PayPal', 'Amex'].map((m) => (
                  <div key={m} className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 uppercase">
                    {m}
                  </div>
                ))}
              </div>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                India
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="py-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center md:text-left text-gray-400 text-xs font-medium">
            &copy; {currentYear} ShopVista. All rights reserved. Elegant solutions for every occasion.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
             Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Celebration
          </div>
        </div>
      </div>
    </footer>
  )
}
