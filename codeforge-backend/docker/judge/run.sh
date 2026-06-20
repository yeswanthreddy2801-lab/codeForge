#!/bin/bash
SOURCE_FILE=$1
INPUT_FILE=$2
TIME_LIMIT_SECS=$3
MEMORY_LIMIT_MB=$4

EXT="${SOURCE_FILE##*.}"

if [ "$EXT" = "cpp" ]; then
    g++ -O2 -o sol $SOURCE_FILE 2> compile_err.txt
    if [ $? -ne 0 ]; then
        cat compile_err.txt >&2
        exit 2
    fi
    timeout ${TIME_LIMIT_SECS}s ./sol < $INPUT_FILE
elif [ "$EXT" = "java" ]; then
    javac $SOURCE_FILE 2> compile_err.txt
    if [ $? -ne 0 ]; then
        cat compile_err.txt >&2
        exit 2
    fi
    timeout ${TIME_LIMIT_SECS}s java -Xmx${MEMORY_LIMIT_MB}m Solution < $INPUT_FILE
elif [ "$EXT" = "py" ]; then
    timeout ${TIME_LIMIT_SECS}s python3 $SOURCE_FILE < $INPUT_FILE
fi
