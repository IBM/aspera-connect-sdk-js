# Contributing

First off, thank you for your interest!

The Aspera Connect SDK for JavaScript is an **open source** project at IBM. We pride ourselves in open and inclusive development. If you're wondering more about our contribution process, you're in the right place.

## Code of conduct

We value all of our community members, and thus want to foster a positive contributing environment. Please take a look at our [code of conduct](./CODE_OF_CONDUCT.md) before beginning any work.

## Who can contribute?

Anyone! The one and only requirement is you'll need a [public GitHub account](https://github.com/join), as all our assets live on GitHub.

- **Bug Reports:** Found an issue? Feel free to [open a bug report](https://github.com/IBM/aspera-connect-sdk-js/issues) to notify us of a potential issue, but please include as much detailed information as possible, such as the version of the Aspera Connect SDK, configuration options, browser version, etc.
- **Development:** If coding is your thing, you can help us by contributing bug fixes or new features.
- **Documentation:** Our documentation is just as important as the code itself, and anyone is welcome contribute to our documentation to make sure it stays correct and up-to-date.

## Prerequisites

Before contributing, check out the [README](../README.md#prerequisites) to make sure you have the necessary tools installed.

## Start contributing

### 1. Fork the repo:

Go to the [Aspera Connect SDK](https://github.com/IBM/aspera-connect-sdk-js) repository in GitHub and click the `Fork` button in the top-right corner. This will create a copy repo of the Aspera Connect SDK associated with your account.

### 2. Clone your fork:

```sh
git clone git@github.com:[your_github_username]/aspera-connect-sdk-js.git
cd aspera-connect-sdk-js
```

See [GitHub docs](https://help.github.com/articles/fork-a-repo/) for more
details.

### 3. Add upstream remotes

When you clone your forked repo, running `git remote -v` will show that the
`origin` is pointing to your forked repo by default.

Now you need to add the `IBM/aspera-connect-sdk-js` repo as your upstream
remote branch:

```sh
# Add the upstream remote to your repo
git remote add upstream git@github.com:IBM/aspera-connect-sdk-js.git

# Verify the remote was added
git remote -v
```

Your terminal should output something like this:

```sh
origin  [your forked repo] (fetch)
origin  [your forked repo] (push)
upstream    git@github.com:IBM/aspera-connect-sdk-js.git (fetch)
upstream    git@github.com:IBM/aspera-connect-sdk-js.git (push)
```

### 4. Work in a branch

When contributing, your work should always be done in a branch off of your repo, this is also how you will submit your pull request when your work is done.

To create a new branch, ensure you are in your forked branch in your terminal
and run:

```sh
git pull origin main
git checkout -b {your-branch-name}
```

### 5. Build

From the root directory of your fork, run:

```sh
# To install the project's dependencies
npm install

# To build the project:
npm run build
```

For coding style, we generally follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).

### 6. Test your code

If you're contributing, test your changes by running our test commands:

```sh
npm run test
```

When adding or changing functionality, please include new tests for them as part of your contribution. Also, always make sure to run our linter command:

```sh
npm run lint
```

### 7. Make a pull request

**Note:** Before you make a pull request, [search](https://github.com/IBM/aspera-connect-sdk-js/issues) the issues to see if a similar issue has already been submitted. If a similar issue has been submitted, assign yourself or ask to be assigned to the issue by posting a comment. If the issue does not exist, please make a new issue. Issues give us context about what you are contributing and expedite the process to getting your contributions merged.

When you're at a good stopping place and you're ready for feedback from other
contributors and maintainers, **push your commits to your fork**:

To do so, go to your terminal and run:

```sh
git add -A
git commit -m "YOUR  COMMIT MESSAGE HERE"
```

#### Commit tip

> **Writing commit messages**
>
> - `<type>` indicates the type of commit that's being made. This can be:
>   `feat`, `fix`, `perf`, `docs`, `chore`, `style`, `refactor`
> - `<scope>` The scope could be anything specifying place of the commit change
>   or the thing(s) that changed.

After your changes are committed, run:

```sh
git push -u origin { YOUR_BRANCH_NAME }
```

In your browser, navigate to
[IBM/aspera-connect-sdk-js](https://github.com/IBM/aspera-connect-sdk-js)
and click the button that reads `Compare & pull request`

Write a title and description then click `Create pull request`

- [How to write the perfect pull request](https://github.com/blog/1943-how-to-write-the-perfect-pull-request)

### 9. Updating a pull request

Stay up to date with the activity in your pull request. Maintainers from the Aspera Connect SDK team will be reviewing your work and making comments, asking questions and suggesting changes to be made before they merge your code.

When you need to make a change, use the same method detailed above except you no longer need to run `git push -u origin { YOUR_BRANCH_NAME }` just `git push`.

Once all revisions to your pull request are complete, one of the maintainers will squash and merge your commits for you.
