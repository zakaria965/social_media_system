"use client"

import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { cn } from "@/lib/utils"

function InfoItem({ icon: Icon, title, value, href }: { icon: any; title: string; value: React.ReactNode; href?: string }) {
  const content = (
    <div className="flex items-center gap-4">
      {/* Icon Container: 48px size, 12px border radius, rgba(34,197,94,0.08) bg, primary brand green border */}
      <div className="size-12 rounded-[12px] bg-[rgba(34,197,94,0.08)] flex items-center justify-center shrink-0 border border-[rgba(34,197,94,0.12)]">
        <Icon className="size-5 text-[#22C55E]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{title}</p>
        <div className="text-base font-bold text-[#0F172A] mt-0.5 transition-colors">
          {value}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block group focus:outline-none">
        {content}
      </a>
    )
  }

  return content
}

export default function ContactPage() {
  const [formSubject, setFormSubject] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <Navbar />
      {/* Main Page: Background #FCFAF6 with subtle grid pattern overlay (2-4% opacity) */}
      <main className="relative min-h-screen bg-[#FCFAF6] text-[#0F172A] font-sans antialiased overflow-hidden selection:bg-[#22C55E]/20 selection:text-[#0F172A]">
        {/* Soft grid pattern background overlay (2-4% opacity) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Ambient top light */}
        <div className="pointer-events-none absolute top-0 left-1/4 size-[500px] rounded-full bg-[#22C55E]/5 blur-[100px]" />

        {/* Centered 2-column hero layout */}
        <div className="relative max-w-7xl mx-auto px-5 md:px-12 min-h-screen flex items-center pt-28 pb-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center w-full">
            
            {/* Left Column: GrowWave Information (45% ratio on desktop) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4 flex flex-col gap-6 md:gap-8 justify-center"
            >
              {/* Small Label */}
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#22C55E]">
                  CONTACT GROWWAVE
                </span>
                
                {/* Main Heading */}
                <h1 className="mt-3 text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-[#0F172A] leading-[1.1]">
                  Let&apos;s Build Something Amazing Together
                </h1>
                
                {/* Supporting Text (max width 480px) */}
                <p className="mt-6 text-base text-[#64748B] leading-relaxed max-w-[480px]">
                  Need help with GrowWave? Our team is ready to assist with support requests, partnerships, business inquiries, and product questions. We typically respond within 24 hours.
                </p>
              </div>

              {/* Contact Information display as clean vertical list */}
              <div className="space-y-5 mt-2">
                <InfoItem 
                  icon={Mail} 
                  title="Email" 
                  value={
                    <a href="mailto:support@growwave.com" className="hover:text-[#22C55E] transition-colors">
                      support@growwave.com
                    </a>
                  } 
                />
                
                <InfoItem 
                  icon={Phone} 
                  title="Phone" 
                  value={
                    <div className="flex flex-col">
                      <a href="tel:+252637157032" className="hover:text-[#22C55E] transition-colors">
                        +252 63 7157032
                      </a>
                      <a href="tel:+252672032217" className="hover:text-[#22C55E] transition-colors">
                        +252 67 2032217
                      </a>
                    </div>
                  } 
                />
                
                <InfoItem 
                  icon={MapPin} 
                  title="Location" 
                  value={
                    <span>Hargeisa, Somaliland</span>
                  } 
                />
                
                <InfoItem 
                  icon={Clock} 
                  title="Support" 
                  value={
                    <span>24/7 Online Support</span>
                  } 
                />
              </div>
            </motion.div>

            {/* Right Column: Contact Form Card (55% ratio on desktop) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6 flex justify-center w-full"
            >
              <ContactForm 
                nameInputRef={nameInputRef} 
                subject={formSubject} 
                setSubject={setFormSubject} 
              />
            </motion.div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
