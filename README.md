
````md
# 프런트 개발환경 세팅 가이드

> Android용 가이드입니다.  
> 현재 프로젝트는 Expo Go QR 실행 방식이 아니라, 개발 빌드 앱을 설치해서 실행하는 방식입니다.

---

## 🛠 사전 준비

### 1. Node.js 설치

👉 https://nodejs.org 에서 **LTS 버전** 다운로드 후 설치

설치 확인:

```bash
node -v
````

`v24.14.1` 이상이면 OK

---

### 2. Android Studio 설치

안드로이드 기기에 직접 앱을 설치해서 실행하기 위해 필요합니다.

👉 [https://developer.android.com/studio](https://developer.android.com/studio)

설치 후 아래 항목이 포함되어 있는지 확인해주세요.

* Android SDK
* Android SDK Platform-Tools
* Android Emulator

---

### 3. 휴대폰 개발자 옵션 설정

실제 안드로이드 폰에 앱을 설치하려면 USB 디버깅을 켜야 합니다.

1. 휴대폰 설정 → 휴대전화 정보
2. 소프트웨어 정보
3. 빌드 번호를 7번 터치
4. 설정 → 개발자 옵션
5. USB 디버깅 ON

---

## 🚀 시작하기

### 1단계 — 레포 클론

```bash
git clone https://github.com/2026-mju-capstone/front.git
cd front
```

---

### 2단계 — 패키지 설치

```bash
npm install
```

---

### 3단계 — 환경변수 설정

프로젝트 루트, 즉 `app`, `assets`, `components` 폴더가 있는 위치에 `.env` 파일을 직접 만들어야 합니다.

#### 1. 프로젝트 최상위 폴더로 이동

`front` 폴더 안에 `app`, `assets`, `components` 등이 있는 위치입니다.

#### 2. `.env` 파일 생성

VSCode / Cursor 사용 중이라면
왼쪽 파일 트리에서 프로젝트 폴더 우클릭 → `New File` → 파일 이름을 `.env` 로 입력

#### 3. 아래 내용 붙여넣기

```env
EXPO_PUBLIC_BASE_URL=http://52.63.7.132:8080
```

#### 4. 저장

Windows: `Ctrl + S`
Mac: `Cmd + S`

> ⚠️ 파일 이름이 반드시 `.env` 여야 합니다.
> `.env.txt` 로 저장되지 않도록 주의해주세요.
> 이 파일은 git에 올라가지 않습니다.

---

## 📱 앱 실행 방법

현재 프로젝트는 Expo Go 앱에서 QR을 스캔해서 실행하는 방식이 아닙니다.

개발용 앱을 휴대폰에 직접 설치한 뒤 실행해야 합니다.

---

### Android 실행

휴대폰을 USB로 PC에 연결한 뒤 아래 명령어를 실행합니다.

```bash
npx expo install expo-dev-client
npx expo run:android
```

처음 실행하면 휴대폰에 개발용 앱이 설치됩니다.
이후에는 설치된 앱을 실행해서 개발 화면에 진입할 수 있습니다.

---


## ❗ 주의사항

* Expo Go 앱으로는 실행되지 않습니다.
* 웹 QR을 스캔해도 바로 접속되지 않을 수 있습니다.
* 반드시 `npx expo run:android` 로 개발용 앱을 설치해야 합니다.
* 휴대폰과 개발 PC는 같은 와이파이에 연결되어 있어야 합니다.
* 학교 와이파이처럼 기기 간 통신이 막힌 환경에서는 연결이 안 될 수 있습니다.
* 연결이 안 될 경우 핫스팟을 사용해보세요.
* USB 연결 시 휴대폰에서 “USB 디버깅 허용”을 눌러야 합니다.

---

## ✅ 자주 발생하는 문제

### QR을 찍었는데 Expo Go에서 열리지 않아요

정상입니다.
이 프로젝트는 Expo Go가 아니라 개발 빌드 앱으로 실행해야 합니다.

```bash
npx expo run:android
```

위 명령어로 앱을 먼저 설치해주세요.

---

### `localhost:8081` 화면이 떠요

개발 서버 주소가 PC 기준으로 잡힌 상태일 수 있습니다.
휴대폰과 PC가 같은 네트워크에 있는지 확인하고, 안 되면 핫스팟으로 연결해보세요.

---

### 앱 설치가 안 돼요

아래 내용을 확인해주세요.

* USB 디버깅이 켜져 있는지
* 휴대폰에서 USB 디버깅 허용을 눌렀는지
* Android Studio / SDK / Platform-Tools가 설치되어 있는지
* USB 케이블이 데이터 전송을 지원하는지

```
