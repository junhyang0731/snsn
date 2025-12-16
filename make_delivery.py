import os
import zipfile
import datetime

# ---------------------------------------------------------
# 설정: 여기에 기본 텍스트 템플릿을 정의합니다
# ---------------------------------------------------------
TEMPLATE = """안녕하십니까? snacksnake (구 XYON)입니다. 저희 상품을 구매해 주셔서 진심으로 감사드립니다.
2025년 12월 중순자로 디스코드에서 운영하던 XYON이 snacksnake (snsn.shop)로 전환되었음을 알려드립니다.

--상품 내역 안내--
귀하의 구매 상품: {product_name}
구매 상품의 총 가격: {price}
구매 상품 보유 가능 기간: {duration}
인증키: {license_key}
구매 인증: {purchase_id}
위 내역 중 알맞지 않은 내용이 있다면 즉시 support@snsn.shop로 연락 주시기 바랍니다.

--상품 사용방법--
동봉된 key_insert.exe에 위에 써있는 "인증키"를 입력하십시오. 인증키는 그 누구와도 공유해서는 안되며 이미 등록된 상태에서 또 다시 입력할 시 원래 계정에서도 사용할 수 없습니다.
인증키를 입력한 후 원하는 치트를 선택한 후 execute를 누르십시오. 이 과정에서 프로그램이 잠시 비활성화 될 수 있으나 정상 상태입니다.


--이 외 상품 안내사항--
- 상품을 2개 이상의 계정 또는 PC에서 등록하려고 시도하는 경우 인증키는 즉시 비활성화되며 다시 복구할 수 없습니다. 
- 상품을 영구제가 아닌 기간제로 구매하셨을 경우 연장은 불가하며 새로운 인증키를 구입하셔야 합니다.
- 인증키가 동작하지 않는 경우 support@snsn.store로 연락 주시기 바랍니다.
- 구매 이후에 환불은 불가합니다.
"""

def create_dummy_exe():
    if not os.path.exists("key_insert.exe"):
        print("⚠️ 'key_insert.exe' 파일이 없어서 빈 파일을 생성합니다.")
        with open("key_insert.exe", "wb") as f:
            f.write(b"This is a placeholder for the real executable.")

def main():
    print("="*40)
    print("  SNACKSNAKE 배포 파일 생성기 v1.0")
    print("="*40)

    # 사용자 입력 받기
    product_name = input("1. 상품명 (예: Valorant ESP): ").strip()
    price = input("2. 가격 (예: 15,000원): ").strip()
    duration = input("3. 기간 (예: 30일 / 영구제): ").strip()
    license_key = input("4. 인증키 (Key): ").strip()
    purchase_id = input("5. 구매 인증번호 (Purchase ID): ").strip() or "N/A"

    # readme 내용 채우기
    readme_content = TEMPLATE.format(
        product_name=product_name,
        price=price,
        duration=duration,
        license_key=license_key,
        purchase_id=purchase_id
    )

    # 출력 파일명 생성
    # 파일명에 사용할 수 없는 문자 제거
    safe_name = "".join([c for c in product_name if c.isalpha() or c.isdigit() or c in (' ', '-', '_')]).strip()
    safe_key = "".join([c for c in license_key if c.isalnum()]).strip()
    zip_filename = f"Delivery_{safe_name}_{safe_key}.zip"

    # ZIP 파일 생성
    try:
        create_dummy_exe()
        
        with zipfile.ZipFile(zip_filename, 'w') as zf:
            # key_insert.exe 추가
            zf.write("key_insert.exe")
            # readme.txt 생성해서 추가
            zf.writestr("readme.txt", readme_content)
        
        print("\n" + "="*40)
        print(f"✅ 생성 완료: {zip_filename}")
        print("="*40)
    
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()
