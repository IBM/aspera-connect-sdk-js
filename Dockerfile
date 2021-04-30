FROM node:12-alpine

LABEL maintainer="David Wosk <dwosk@us.ibm.com>"

RUN \
    apk add -U \
        # build deps
        git \
        zip \
        # test deps
        chromium \
        && \
    # workaround to run preinstall as root
    npm set unsafe-perm true

ENV CHROME_BIN /usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Define working directory
WORKDIR /connect-sdk

# Start from a shell prompt by default
CMD ["/bin/sh"]
