# Components

This doc contains components and use cases

## BottomSheet

- A bottom sheet which must be used for all modals in the app.
- The body of the bottom sheet model should lazily load and should unmount if it is a huge component. If it is a light component then there There is no need to unmount the body on close of the bottom sheet. refer to `src\components\showcase\index.tsx` for details.
