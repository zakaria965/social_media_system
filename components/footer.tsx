"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX,
  IconYoutube,
} from "@/components/social-brand-icons"

function SocialIcon({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex size-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
      aria-label="Social link"
    >
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-display text-xl font-semibold text-white">GrowWave</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Plan, publish, and grow your social presence from one calm workspace.
              Built for modern teams who value clarity and speed.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/features" className="text-slate-400 transition-colors hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/channels" className="text-slate-400 transition-colors hover:text-white">
                  Channels
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
              Company
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/contact" className="text-slate-400 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 transition-colors hover:text-white">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="#" className="text-slate-400 transition-colors hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 transition-colors hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 transition-colors hover:text-white">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-slate-800 pt-8 md:flex-row md:items-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} GrowWave. All rights reserved.
          </p>
          <div className="flex gap-2">
            <SocialIcon href="#">
              <IconFacebook className="size-4" />
            </SocialIcon>
            <SocialIcon href="#">
              <IconInstagram className="size-4" />
            </SocialIcon>
            <SocialIcon href="#">
              <IconX className="size-4" />
            </SocialIcon>
            <SocialIcon href="#">
              <IconLinkedin className="size-4" />
            </SocialIcon>
            <SocialIcon href="#">
              <IconYoutube className="size-4" />
            </SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  )
}
