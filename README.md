# MarisMasses
Hymn Lyric management app for Stella Maris Church Miramar

# MassCast

Offline-first Catholic hymn presentation system.

## Requirements

Python 3.13+

## Installation

```bash
python -m venv .venv
```

Windows

```bash
.venv\Scripts\activate
```

Linux / Raspberry Pi

```bash
source .venv/bin/activate
```

Install packages

```bash
pip install -r requirements.txt
```

Run

```bash
python run.py
```

Open

http://localhost:8000


Expired Sequence files must be archived in order to speed up the search for the nearest future file. We need a PAT of git to archive past sequence files. This archiving process must be run on the host of the Presenter App so that its system time will be used for Archiving (rather than the Git Pages time of Builder).
To make them permanent across all future sessions, append your export statement to one of your shell initialization files


To set up your export commands permanently on a Raspberry Pi running Raspberry Pi OS (formerly Raspbian), you will want to add them to the hidden configuration files in your user's home directory. [1] 
Here is the exact step-by-step process for a Raspberry Pi setup.
## 1. Edit Your Bash Configuration File
By default, the Raspberry Pi terminal uses the Bash shell. Open your local configuration file using nano, the built-in command-line text editor:
```bash
nano ~/.bashrc
```
## 2. Add Your Export Commands
Scroll all the way down to the very bottom of the file using your keyboard's arrow keys. Type or paste your export statements there: [

# Custom Raspberry Pi environment variables
```bash
export MASSCAST_GITHUB_TOKEN="YOUR_TOKEN" # token must have access to repo with "Metadata" and "Content" Read/Write permissions.

```

(Note: If you are on a newer Raspberry Pi OS using the default pi user or a custom username, ensure your path reflects your actual home directory, like /home/your_username/). [

## 3. Save and Exit Nano

   1. Press Ctrl + O (Write Out) to save.
   2. Press Enter to confirm the filename.
   3. Press Ctrl + X to exit the editor. [7, 8, 9] 

## 4. Activate the Changes Immediately
Your Raspberry Pi won't read the new changes until you open a new terminal window, or force it to reload right now by running:
```bash
source ~/.bashrc
```
------------------------------
## Special Scenario: Headless Pis and SSH (If Needed)
If you run your Raspberry Pi "headless" (without a monitor) and log in strictly via SSH, or if you want these variables available during system automation tasks:

* For SSH logins: Sometimes the system reads ~/.bash_profile or ~/.profile instead of .bashrc. If your variables don't appear over SSH, open your profile file:
```bash
nano ~/.profile
```
* Add this block to the bottom to ensure it pulls in your .bashrc settings automatically:
```bash
if [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        . "$HOME/.bashrc"
    fifi
```

