import LandingNav         from '@/components/landing/LandingNav'
import LandingHero        from '@/components/landing/LandingHero'
import LandingHowItWorks  from '@/components/landing/LandingHowItWorks'
import LandingScreenshots from '@/components/landing/LandingScreenshots'
import LandingBenefits    from '@/components/landing/LandingBenefits'
import LandingUseCases    from '@/components/landing/LandingUseCases'
import LandingContact     from '@/components/landing/LandingContact'
import LandingFooter      from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingScreenshots />
        <LandingBenefits />
        <LandingUseCases />
        <LandingContact />
      </main>
      <LandingFooter />
    </>
  )
}
