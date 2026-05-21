
import { useEffect } from 'react'
import Navbar from '../components/landing/Navbar'
import Ticker from '../components/landing/Ticker'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import LiveDemo from '../components/landing/LiveDemo'
import Features from '../components/landing/Features'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  useEffect(() => {
    document.title = "ThreatLens | Real-time Threat Intelligence"
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'ThreatLens delivers real-time vulnerability intelligence, CVE tracking, and security alerts tailored to your organization\'s tech stack.')
    }
  }, [])

  return (
    <>
      <Navbar />
      <Ticker />
      <Hero />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <CTA />
      <Footer />
    </>
  )
}

