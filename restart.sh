#!/bin/bash
port=11410
process_pid=$(netstat -anp tcp | grep $port | grep -Po '\d+\/node' | grep -Po '\d+' | sort | uniq)
echo "Process ${process_pid} found running on port ${port}"
kill -9 $process_pid
echo "Restarting"
nohup npm run start:prod&
