# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Admin Login" [level=1] [ref=e9]
      - paragraph [ref=e10]: Enter your admin credentials
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Username
        - generic [ref=e14]:
          - img [ref=e15]
          - textbox "Enter your username" [ref=e18]: admin'--
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - generic [ref=e21]:
          - img [ref=e22]
          - textbox "Enter your password" [active] [ref=e25]: any_password
          - button [ref=e26] [cursor=pointer]:
            - img [ref=e27]
      - button "Verifying…" [disabled] [ref=e30]
      - generic [ref=e31]:
        - paragraph [ref=e32]: 🔐 Two-factor authentication enabled for enhanced security
        - paragraph [ref=e33]: A 6-digit OTP will be sent to the admin email after credential verification
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - generic [ref=e42]:
      - text: Compiling
      - generic [ref=e43]:
        - generic [ref=e44]: .
        - generic [ref=e45]: .
        - generic [ref=e46]: .
  - alert [ref=e47]
```