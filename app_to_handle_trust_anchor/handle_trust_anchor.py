#!/usr/bin/env python

import sys
import json
import struct

import os

try:
    # Python 3.x version
    # Read a message from stdin and decode it.
    def getMessage():
        rawLength = sys.stdin.buffer.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.buffer.read(messageLength).decode('utf-8')
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(messageContent):
        encodedContent = json.dumps(messageContent).encode('utf-8')
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(encodedMessage):
        sys.stdout.buffer.write(encodedMessage['length'])
        sys.stdout.buffer.write(encodedMessage['content'])
        sys.stdout.buffer.flush()

    while True:
        receivedMessage = getMessage()
        if receivedMessage == "add":
            add_cert = os.system('certutil -A -n BLOCKCHAIN -t "TCu,TCu,TCu" -i /home/andrea/Desktop/tesi_repository_2/bindingpoc/cert/cert_root_CA.crt -d /home/andrea/.mozilla/firefox/tlingthy.default-release')
            if add_cert == 0:
                    sendMessage(encodeMessage("CA aggiunta con successo"))
            else:
                    sendMessage(encodeMessage("CA non aggiunta con successo"))
        else:
            if receivedMessage == "rm":
                rm_cert = os.system('certutil -D -n "BLOCKCHAIN" -d /home/andrea/.mozilla/firefox/tlingthy.default-release')
            if rm_cert == 0:
                os.system("killall firefox")
                os.system("firefox &")
                sendMessage(encodeMessage("CA rimossa con successo"))
            else:
                sendMessage(encodeMessage("CA non rimossa con successo"))
except AttributeError:
    # Python 2.x version (if sys.stdin.buffer is not defined)
    # Read a message from stdin and decode it.
    def getMessage():
        rawLength = sys.stdin.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.read(messageLength)
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(messageContent):
        encodedContent = json.dumps(messageContent)
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(encodedMessage):
        sys.stdout.write(encodedMessage['length'])
        sys.stdout.write(encodedMessage['content'])
        sys.stdout.flush()

    while True:
        receivedMessage = getMessage()
        if receivedMessage == "add":
            add_cert = os.system('certutil -A -n BLOCKCHAIN -t "TCu,TCu,TCu" -i /home/andrea/Desktop/tesi_repository_2/bindingpoc/cert/cert_root_CA.crt -d /home/andrea/.mozilla/firefox/tlingthy.default-release')
            if add_cert == 0:
                    sendMessage(encodeMessage("CA aggiunta con successo"))
            else:
                    sendMessage(encodeMessage("CA non aggiunta con successo"))
        else:
            if receivedMessage == "rm":
                rm_cert = os.system('certutil -D -n "BLOCKCHAIN" -d /home/andrea/.mozilla/firefox/tlingthy.default-release')
            if rm_cert == 0:
                os.system("killall firefox")
                os.system("firefox &")
                sendMessage(encodeMessage("CA rimossa con successo"))
            else:
                sendMessage(encodeMessage("CA non rimossa con successo"))
