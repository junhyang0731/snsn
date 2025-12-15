import { useLanguage } from "@/components/language-provider"
import FeedbackModal from "./feedback-modal"

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-foreground mb-4">snacksnake</h4>
            <p className="text-sm text-muted-foreground">{t('footer.desc')}</p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">{t('footer.support')}</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {t('footer.faq')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {t('footer.refund')}
                </a>
              </li>
            </ul>
          </div>
          {/* Quick Links Column Removed */}

          <div>
            <h5 className="font-semibold text-foreground mb-3">{t('footer.contact')}</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Telegram: @snacksnake_support</li>
              <li>Email: support@snsn.store</li>
              <li><FeedbackModal /></li>
              <li>Operating Hours: 24/7</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-foreground mb-3">{t('footer.payment')}</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>무통장입금</li>
              <li>코인</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2024 snacksnake. All rights reserved.</p>
          <p className="text-xs mt-1 opacity-50">v2.28</p>
        </div>
      </div>
    </footer>
  )
}
