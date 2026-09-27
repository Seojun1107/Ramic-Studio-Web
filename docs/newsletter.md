# Ramic Studio 뉴스레터

홈페이지의 **05 / 소식 받기** 구독 폼은 서버의 MongoDB에 이메일을 저장하고, 관리자가 새 공지를 발행할 때 활성 구독자에게 이메일을 전송합니다.

## 동작 흐름

1. 방문자가 `ramicstudio.com`에서 이메일을 입력하고 구독합니다.
2. `newsletter_subscribers` MongoDB 컬렉션에 이메일과 구독 상태가 저장됩니다.
3. 관리자가 관리자 페이지에서 새 공지를 발행합니다.
4. **EMAIL 뉴스레터 → 발행 시 이메일 구독자에게 공지 보내기**가 켜져 있으면 서버가 Resend API를 호출합니다.
5. 이메일에는 해당 공지 페이지 링크와 개인별 구독 취소 링크가 포함됩니다.
6. 구독 취소 링크를 누르면 해당 구독자의 `active`가 `false`가 되어 이후 발송 대상에서 제외됩니다.
7. 기존 공지를 수정하는 경우에는 이메일을 다시 발송하지 않습니다.

## 서버 환경변수

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
NEWSLETTER_FROM=Ramic Studio <news@ramicstudio.com>
PUBLIC_BASE_URL=https://ramicstudio.com
NEWSLETTER_TOKEN_SECRET=긴-랜덤-문자열
```

`NEWSLETTER_TOKEN_SECRET`를 생략하면 기존 `JWT_SECRET`을 사용합니다. 운영 환경에서는 별도의 긴 랜덤 값을 권장합니다.

## Resend / ramicstudio.com 설정

Resend에서 `ramicstudio.com`을 발신 도메인으로 등록하고 DNS에서 Resend가 안내하는 SPF/DKIM 레코드를 등록해야 합니다. 도메인 인증이 완료된 뒤 `NEWSLETTER_FROM`의 주소를 `@ramicstudio.com`으로 사용할 수 있습니다.

코드는 Resend SDK를 추가하지 않고 REST API를 직접 호출하므로 별도의 npm 패키지가 필요하지 않습니다.

## 발송 실패 처리

공지 자체는 MongoDB에 정상 저장됩니다. 이메일 발송이 일부 실패하더라도 공지 발행을 실패로 되돌리지 않고 관리자 화면에 전송/실패 건수를 표시합니다.

Resend API 키가 아직 없으면 구독 데이터는 정상 저장되며, 공지 발행 시 이메일 전송만 건너뜁니다.
