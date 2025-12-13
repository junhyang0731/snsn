export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-foreground mb-4">snacksnake</h4>
            <p className="text-sm text-muted-foreground">압도적인 성능의 발로란트 치트 플랫폼.</p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">고객 지원</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  환불 정책
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">정보</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  개인정보 보호
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  이용 약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  연락처
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">결제 방법</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>무통장입금</li>
              <li>코인</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 snacksnake. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
