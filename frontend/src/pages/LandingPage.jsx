
import Navbar from '../components/landing/Navbar'
import Ticker from '../components/landing/Ticker'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import LiveDemo from '../components/landing/LiveDemo'
import Features from '../components/landing/Features'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
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
