## Don't include `node_modules` in your repository

When using Node with Git, the best practice is to not add `node_modules` to your version control. You can do this by creating a `.gitignore` file in the root directory with the contents:

```
node_modules/
```

If you accidentally added `node_modules` to your version control (you'll see that it shows up on Github), run the command `git rm --cached -r node_modules/*` in the root directory to remove it from Git (but not the directory).

## You are missing smodule from your `package.json`

Use `npm install facebook-node-sdk --save` in order to automatically add it. Check your current `node_modules` folder for what should be in your "dependencies" section of your `package.json`.

## You include .DS_Store in your git

Add this on a new line in your `.gitignore` file, then `git rm .DS_Store` it.
