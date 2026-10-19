# HERE · Media kit

HERE (store name **I am Here**, #iamhere) is a venue-first social app for nights out. See which venues are live tonight, check in where you are by sliding the pin, share a photo of the moment and join the venue’s group chat with everyone who’s there. Chats reset every night at 04:00; posts and memories stay.

![HERE media kit: screens from the iOS 27 prototype](here-media-kit.jpg)

## Screens

Every screen comes from the iOS prototype (Expo SDK 58) running in the iOS 27 simulator with the app set to English. The app also speaks Turkish: Settings › Language.

| | | |
|:-:|:-:|:-:|
| <img src="screens/01-home.jpg" width="260" alt="Home · live venues"><br>Home · live venues | <img src="screens/02-tonight.jpg" width="260" alt="Tonight · events and posts"><br>Tonight · events and posts | <img src="screens/03-here.jpg" width="260" alt="Here · venues around you"><br>Here · venues around you |
| <img src="screens/04-check-in.jpg" width="260" alt="Check in · slide the pin"><br>Check in · slide the pin | <img src="screens/05-venue-chat.jpg" width="260" alt="Venue chat · plan card"><br>Venue chat · plan card | <img src="screens/06-messages.jpg" width="260" alt="Messages · group chats"><br>Messages · group chats |
| <img src="screens/07-explore.jpg" width="260" alt="Explore · live map"><br>Explore · live map | <img src="screens/08-venue.jpg" width="260" alt="Venue page"><br>Venue page | <img src="screens/09-profile.jpg" width="260" alt="Profile"><br>Profile |
| <img src="screens/10-to-here.jpg" width="260" alt="Profile · To-HERE list"><br>Profile · To-HERE list | <img src="screens/11-memories.jpg" width="260" alt="Memories"><br>Memories | <img src="screens/12-edit-profile.jpg" width="260" alt="Edit profile"><br>Edit profile |
| <img src="screens/13-dark-home.jpg" width="260" alt="Dark · home"><br>Dark · home | <img src="screens/14-dark-check-in.jpg" width="260" alt="Dark · check in"><br>Dark · check in | <img src="screens/15-dark-venue-chat.jpg" width="260" alt="Dark · venue chat"><br>Dark · venue chat |
| <img src="screens/16-dark-messages.jpg" width="260" alt="Dark · messages"><br>Dark · messages | <img src="screens/17-dark-profile.jpg" width="260" alt="Dark · profile"><br>Dark · profile | <img src="screens/18-settings.jpg" width="260" alt="Settings · language"><br>Settings · language |
| <img src="screens/19-duo-home.jpg" width="260" alt="iPhone Duo · home"><br>iPhone Duo · home | <img src="screens/20-duo-messages.jpg" width="260" alt="iPhone Duo · messages"><br>iPhone Duo · messages |  |

## Updating the kit

1. Run the app in the iOS simulator (iPhone 18 Pro, iOS 27) and set Settings › Language to English.
2. Save the screenshots listed in [`apps/mobile/scripts/build-media-kit.py`](../../apps/mobile/scripts/build-media-kit.py) to `docs/media-kit/screens/` as 804 px wide JPGs.
3. Build the board and the GitHub social preview (needs Pillow):

   ```bash
   cd apps/mobile && python3 scripts/build-media-kit.py
   ```

The social preview ([`social-preview.jpg`](social-preview.jpg), 1280 × 640) is uploaded by hand in the repository’s Settings › General › Social preview.
