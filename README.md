llmod
-----

List all of the javascript in your project, both plain `.js` files and node
modules.

![](https://shared.by.re-becca.org/misc-images/llmod-example.png)
```
🕧  rebecca@Caldina:~/code/llmod/example$ [master] llmod
example local
├── index.js local
├─┬ lib
│ └── lib/snorkack.js local
└─┬ node_modules
  ├─┬ @iarna/emojitime@1.0.2 private
  │ └─┬ which@1.2.10 public
  │   └── isexe@1.1.2 public
  └── aproba@1.0.3 public → ../../../../../.nvm/versions/node/v4.4.0/lib/node_modules/aproba
🕚  rebecca@Caldina:~/code/llmod/example$ [master *+] / [v1.1.0] llmod snor
example
└─┬ lib
  └── lib/snorkack.js local
🕚  rebecca@Caldina:~/code/llmod/example$ [master *+] / [v1.1.0] llmod which
example
└─┬ node_modules
  ├─┬ @iarna/emojitime
  │ └── which@1.2.10 public
  └── which@1.2.10 public → ../@iarna/emojitime/node_modules/which
```
