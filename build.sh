#!/bin/bash
(cd ./apps/ ; sh build.sh)
(cd ./auth/ ; sh build.sh)
(cd ./booking/ ; sh build.sh)
(cd ./documents/ ; sh build.sh)
(cd ./inventory/ ; sh build.sh)
(cd ./settings/ ; sh build.sh)
(cd ./sale/ ; sh build.sh)
(cd ./pos/ ; sh build.sh)