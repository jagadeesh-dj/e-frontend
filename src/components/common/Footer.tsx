import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin,
  Heart, Shield, Truck, Award, CreditCard, Globe
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
  { icon: Truck, text: 'Same Day Delivery' },
  { icon: Shield, text: 'Secure Payment' },
  { icon: Award, text: 'Quality Guaranteed' },
  { icon: Heart, text: '24/7 Support' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#001433] text-gray-300">
      {/* Customer Support Bar */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-400" />
                <span className="font-semibold text-white">+91 (555) 123-4567</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>support@shopeverse.com</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-primary-400">
                <Truck className="w-4 h-4" />
                Same Day Delivery Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">Shopeverse</span>
                <p className="text-xs text-gray-400 -mt-0.5">Premium Gifts</p>
              </div>
            </Link>
            
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Your destination for premium cakes, fresh flowers, and personalized gifts. 
              Making every celebration memorable with same-day delivery across India and internationally.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <feature.icon className="w-4 h-4 text-primary-400" />
                  <span className="text-xs text-gray-400">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Recipient Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">By Recipient</h4>
            <ul className="space-y-2.5">
              {footerLinks.recipient.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Relationship Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">By Relationship</h4>
            <ul className="space-y-2.5">
              {footerLinks.relationship.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Category Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2.5">
              {footerLinks.category.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Occasions Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Occasions</h4>
            <ul className="space-y-2.5">
              {footerLinks.occasions.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Company Links Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-4">Know About Shopeverse</h4>
              <div className="flex flex-wrap gap-4">
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Policies</h4>
              <div className="flex flex-wrap gap-4">
                {['Privacy Policy', 'Terms of Service', 'Shipping Policy', 'Refund Policy', 'Cookie Policy'].map((link) => (
                  <Link
                    key={link}
                    to={`/${link.toLowerCase().replace(' ', '-')}`}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment & App Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              © {currentYear} Shopeverse. All rights reserved.
            </p>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                We accept:
              </span>
              <div className="flex gap-2">
                {['Visa', 'MC', 'Amex', 'UPI', 'PayPal'].map((method) => (
                  <div
                    key={method}
                    className="px-3 py-1.5 bg-gray-800/50 rounded-lg text-xs text-gray-400"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>

            {/* International */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Globe className="w-4 h-4" />
              <span>Delivering globally</span>
            </div>
          </div>
        </div>
      </div>

      {/* Made with love badge */}
      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-xs flex items-center justify-center gap-2">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by Shopeverse Team
            <span className="mx-2">|</span>
            <span>Delivering happiness since 2024</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
