import json
import re
import math

raw_json_str = """
[
    {
      "id": "27529675763361757",
      "retailer_id": "crkt9v6gx8",
      "name": "🛏️ راحة مثالية لطفلك مع كرسي هزاز وعربة للاطفال الذكي! 🛏️",
      "description": "إذا كنتِ تبحثين عن طريقة مريحة وآمنة لتهدئة صغيرك، فإن هزاز الأطفال هو الحل المثالي! بفضل تصميمه الذكي وتقنياته الحديثة، يوفر لطفلك تجربة نوم هادئة وممتعة.  \\n\\n🔹 مميزات المنتج :  \\n\\n✅ حزام أمان لحماية الطفل – يوفر أمانًا إضافيًا أثناء التأرجح لضمان راحة وسلامة طفلك.  \\n \\n✅ موسيقى بلوتوث مدمجة – يوفر أجواء هادئة من خلال تشغيل الموسيقى المفضلة لديك عبر البلوتوث.  \\n\\nيشتغل عن طريق البطاريات\\n\\nياتي معا طوق العاب للاطفال\\n\\nياتي معا اضافه اربع عجلات وقفل امان للعجلات  لتحريك الطفل\\n\\n*ياتي ثلاث الوان \\n\\nالرمادي\\nالوردي\\nالتفاحي",
      "price": "ر.ي.‏ ١٨٬٠٠٠٫٠٠",
      "currency": "YER",
      "availability": "in stock",
      "condition": "new",
      "url": "https://wa.me/967771370740",
      "image_cdn_urls": [
        {
          "key": "requested",
          "value": "https://scontent-lhr11-1.xx.fbcdn.net/v/t45.5328-4/739214614_1915370639150788_961754228884404942_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=657aed&_nc_ohc=L8SUq-fkuTMQ7kNvwHizFCv&_nc_oc=Adp_90oe-EFsDXYmW997mIpPwJeEaujobZETlHCwmotpVBC9EjKpm77X-mPyKE_6WXk&_nc_zt=23&_nc_ht=scontent-lhr11-1.xx&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQLMBtApOT64hdfSq5k5PY2HPT-LFHLt51YoSTC9f0WoifIkMTF9MqWRNfXsyykrUkJobO2grPGShg&oh=00_AQEoZTeJYnGkNnIFvd3aQ3gHd0COM0I36uIqq6qp8P7Xxw&oe=6A7FC83B"
        },
        {
          "key": "full",
          "value": "https://media-bru2-1.cdn.whatsapp.net/v/t45.5328-4/739214614_1915370639150788_961754228884404942_n.jpg?ccb=1-7&_nc_sid=657aed&_nc_ohc=L8SUq-fkuTMQ7kNvwHizFCv&_nc_oc=Adp_90oe-EFsDXYmW997mIpPwJeEaujobZETlHCwmotpVBC9EjKpm77X-mPyKE_6WXk&_nc_zt=23&_nc_ht=media-bru2-1.cdn.whatsapp.net&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQKgG9Uoh_MLKD3k-9QrJJuweAARMwY7bOfy_-DvYK-itAfOdSynjPAZqhLhoIaVXc6iSSJtL1oh6g&oh=01_Q5Aa5QH8J6JNf6EEhPtKq1dpUKBHy9U7MNZcBH6xxB5MYIhyRQ&oe=6A7FC83B"
        }
      ],
      "additional_image_cdn_urls": [
        [
          {
            "key": "requested",
            "value": "https://scontent-lhr6-2.xx.fbcdn.net/v/t45.5328-4/739176822_1555714709579673_2180838037516300404_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=657aed&_nc_ohc=3nVTe3ofpNcQ7kNvwHXY35u&_nc_oc=AdqFjWL7jyDwDHHXXWIrmlLMN8vWxEEf9ux-UTY71mcPeQy-QcM0WVNd-pbjJq_nV8Y&_nc_zt=23&_nc_ht=scontent-lhr6-2.xx&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQLY9Aw8Curb3BNz72YpKsYuzCd-zQcQWL1AU0GlPkh9-w97MqABWQ2jU4p4YK2nY6abwNNPX5jhHA&oh=00_AQHY5v6dJ8ktX471fxGPCHW8Z1X6zuc96740qtfp3WbuJA&oe=6A7FCA4D"
          },
          {
            "key": "full",
            "value": "https://media-bru2-1.cdn.whatsapp.net/v/t45.5328-4/739176822_1555714709579673_2180838037516300404_n.jpg?ccb=1-7&_nc_sid=657aed&_nc_ohc=3nVTe3ofpNcQ7kNvwHXY35u&_nc_oc=AdqFjWL7jyDwDHHXXWIrmlLMN8vWxEEf9ux-UTY71mcPeQy-QcM0WVNd-pbjJq_nV8Y&_nc_zt=23&_nc_ht=media-bru2-1.cdn.whatsapp.net&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQJUFVKQDp8ZNgrp4NsFVDPfCO1L2v5VyUba6kNTID_Mos6UC11SyWkHt5XR_o7rcNuERS4ANQeNMw&oh=01_Q5Aa5QHXOqp9DNiUAugmageDYTI2ih8gnzEsT50S6Glv2OLubg&oe=6A7FCA4D"
          }
        ],
        [
          {
            "key": "requested",
            "value": "https://scontent-lhr11-1.xx.fbcdn.net/v/t45.5328-4/738828682_992930923736397_1387857073286322163_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=657aed&_nc_ohc=O5GRPTsD00cQ7kNvwEwY6hP&_nc_oc=AdpO1sbsA9J7kN52GU6i7yL5G4Iz-dz0TtIawu5bMnPOnWkUsM-AeDrBWkm6BSE2lKM&_nc_zt=23&_nc_ht=scontent-lhr11-1.xx&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQIViSgEhylOlE0psWSK4g59oM52vGTPU3RtWS3eMMFqgL2g4jFY8dACSaq3_ECvLPAUcaKlYD0IIA&oh=00_AQHslFFZ-evxxGOevjklXPpgkNqm8ksZW1FRiFUBaTRdLg&oe=6A7F9FBD"
          },
          {
            "key": "full",
            "value": "https://media-bru2-1.cdn.whatsapp.net/v/t45.5328-4/738828682_992930923736397_1387857073286322163_n.jpg?ccb=1-7&_nc_sid=657aed&_nc_ohc=O5GRPTsD00cQ7kNvwEwY6hP&_nc_oc=AdpO1sbsA9J7kN52GU6i7yL5G4Iz-dz0TtIawu5bMnPOnWkUsM-AeDrBWkm6BSE2lKM&_nc_zt=23&_nc_ht=media-bru2-1.cdn.whatsapp.net&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQI9EYPWvJxxSYPdVq8kgDaJZzRbW1KbEcXhytniNUCSACmCm_dJmAMZSI-Jx0xirUp-nphLuHn3FQ&oh=01_Q5Aa5QElnRc6HaU3hdBqtqCyXSaqs_jfkfqHaHv_ROBGAN_NWQ&oe=6A7F9FBD"
          }
        ],
        [
          {
            "key": "requested",
            "value": "https://scontent-lhr6-1.xx.fbcdn.net/v/t45.5328-4/738853769_854832124072365_7143903837320072847_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=657aed&_nc_ohc=F8ggojhDh6kQ7kNvwHMhcOL&_nc_oc=AdqAALyIpdjJlt49p3fmwwnlV0RhEs_3_2iASXVmA2RuxE96D0CwGyrx142KZD8mmD8&_nc_zt=23&_nc_ht=scontent-lhr6-1.xx&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQJ3qtwUVjEpazUXggyNEF5clFaMz3KtlfS8lfISHUCvUCgW5-otO_Nf5VmjFplqRXrajmGZwLUeGA&oh=00_AQFMHDdoiOaCjDdmt3E8IgXPXu1N1Cf_FHvWaG8y7y6F8w&oe=6A7FAB18"
          },
          {
            "key": "full",
            "value": "https://media-bru2-1.cdn.whatsapp.net/v/t45.5328-4/738853769_854832124072365_7143903837320072847_n.jpg?ccb=1-7&_nc_sid=657aed&_nc_ohc=F8ggojhDh6kQ7kNvwHMhcOL&_nc_oc=AdqAALyIpdjJlt49p3fmwwnlV0RhEs_3_2iASXVmA2RuxE96D0CwGyrx142KZD8mmD8&_nc_zt=23&_nc_ht=media-bru2-1.cdn.whatsapp.net&edm=ANyJclEEAAAA&_nc_gid=okwUw7ze_9N7rOXmZ_C0rQ&_nc_tpa=Q5bMBQKd0w1Ya9I9-KibX7hSTedZQ2wyqX27HRv_S53BGAfXTT00drWkZ0Fs54sr05KsbYN-Rkw5J5hKrQ&oh=01_Q5Aa5QGSFLXNKfHGZzsIZURiMUFsPON31I8a-o1Uo-9bFZs8sQ&oe=6A7FAB18"
          }
        ]
      ],
      "video_fetch_status": "NO_STATUS"
    }
]
"""
