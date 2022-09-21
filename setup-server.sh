#!/bin/sh

mkdir -p /gvite && cd /gvite
curl -L https://github.com/vitelabs/go-vite-nightly/releases/download/$GVITE_VERSION/gvite-$GVITE_VERSION-$GVITE_PLATFORM.tar.gz | tar -xz && mv -f gvite-$GVITE_VERSION-$GVITE_PLATFORM/gvite . && rm -rf  gvite-$GVITE_VERSION-$GVITE_PLATFORM
