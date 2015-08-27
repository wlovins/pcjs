/**
 * @fileoverview PCjs-specific BIOS/DOS interrupt definitions.
 * @author <a href="mailto:Jeff@pcjs.org">Jeff Parsons</a>
 * @version 1.0
 * Created 2014-Dec-11
 *
 * Copyright © 2012-2015 Jeff Parsons <Jeff@pcjs.org>
 *
 * This file is part of PCjs, which is part of the JavaScript Machines Project (aka JSMachines)
 * at <http://jsmachines.net/> and <http://pcjs.org/>.
 *
 * PCjs is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version.
 *
 * PCjs is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with PCjs.  If not,
 * see <http://www.gnu.org/licenses/gpl.html>.
 *
 * You are required to include the above copyright notice in every source code file of every
 * copy or modified version of this work, and to display that copyright notice on every screen
 * that loads or runs any version of this software (see Computer.sCopyright).
 *
 * Some PCjs files also attempt to load external resource files, such as character-image files,
 * ROM files, and disk image files. Those external resource files are not considered part of the
 * PCjs program for purposes of the GNU General Public License, and the author does not claim
 * any copyright as to their contents.
 */

"use strict";

/*
 * Components that previously used Debugger interrupt definitions by including:
 *
 *     var Debugger = require("./debugger");
 *
 * and using:
 *
 *      Debugger.INT.FOO
 *
 * must now instead include:
 *
 *      var Interrupts = require("./interrupts");
 *
 * and then replace all occurrences of "Debugger.INT.FOO" with "Interrupts.FOO".
 */

var Interrupts = {
    VIDEO:      0x10,
    DISK:       0x13,
    CASSETTE:   0x15,
    KBD:        0x16,
    RTC:        0x1A,
    TIMER_TICK: 0x1C,
    DOS:        0x21,
    DOS_IDLE:   0x28,
    DOS_NETBIOS:0x2A,
    MOUSE:      0x33,
    WINDBG:     {                   // Windows Debugger (eg, WDEB386) protected-mode interface
        VECTOR:     0x41,
        IS_LOADED:  0x004F,         // AX command
        LOADED:     0xF386,         // returned in AX if Windows Debugger loaded
        LOAD_SEG:   0x0050          // SI==0 if code, 1 if data; BX==segnum-1; CX==selector; DX==data instance; ES:[E]DI->module name
    },
    WINDBGRM:     {                 // Windows Debugger (eg, WDEB386) real-mode interface
        VECTOR:     0x68,
        IS_LOADED:  0x43,           // AH command
        LOADED:     0xF386,         // returned in AX if Windows Debugger loaded
        ENABLED:    false           // support for WINDBGRM interrupts is NOT enabled by default
    },
    FUNCS:      {}                  // filled in only if DEBUGGER is true
};

if (DEBUGGER) {
    /*
     * See Debugger.prototype.replaceRegs() for the rules governing how register contents are replaced in the strings below.
     *
     * Replacements occur in the following order:
     *
     *      Replace every %XX (or %XXX), where XX (or XXX) is a register, with the register's value.
     *      Replace every #XX, where XX is a hex byte value, with the corresponding ASCII character (if printable).
     *      Replace every $XXXX:XXXX, where XXXX:XXXX is a segmented address, with the zero-terminated string at that address.
     *      Replace every ^XXXX:XXXX, where XXXX:XXXX is a segmented address, with the FCB filename stored at that address.
     *
     * The last replacement is obviously DOS-specific, since FCBs are DOS constructs.
     */
    Interrupts.FUNCS[Interrupts.DISK] = {
        0x00: "disk reset",
        0x01: "get status",
        0x02: "read drive %DL (%CH:%DH:%CL,%AL) into %ES:%BX",
        0x03: "write drive %DL (%CH:%DH:%CL,%AL) from %ES:%BX",
        0x04: "verify drive %DL (%CH:%DH:%CL,%AL)",
        0x05: "format drive %DL using %ES:%BX",
        0x08: "read drive %DL parameters into %ES:%DI",
        0x15: "get drive %DL DASD type",
        0x16: "get drive %DL change line status",
        0x17: "set drive %DL DASD type",
        0x18: "set drive %DL media type"
    };
    Interrupts.FUNCS[Interrupts.CASSETTE] = {
        0x80: "open device",
        0x81: "close device",
        0x82: "program termination",
        0x83: "wait %CX:%DXus for event",
        0x84: "joystick support",
        0x85: "SYSREQ pressed",
        0x86: "wait %CX:%DXus",
        0x87: "move block (%CX words)",
        0x88: "get extended memory size",
        0x89: "processor to virtual mode",
        0x90: "device busy loop",
        0x91: "interrupt complete flag set"
    };
    Interrupts.FUNCS[Interrupts.DOS] = {
        0x00: "terminate program",
        0x01: "read character (AL) from stdin with echo",
        0x02: "write character #%DL to stdout",
        0x03: "read character (AL) from stdaux",                                // eg, COM1
        0x04: "write character #%DL to stdaux",                                 // eg, COM1
        0x05: "write character #%DL to stdprn",                                 // eg, LPT1
        0x06: "direct console output (input if %DL=FF)",
        0x07: "direct console input without echo",
        0x08: "read character (AL) from stdin without echo",
        0x09: "write string $%DS:%DX to stdout",
        0x0A: "buffered input (DS:DX)",                                         // byte 0 is maximum chars, byte 1 is number of previous characters, byte 2 is number of characters read
        0x0B: "get stdin status",
        0x0C: "flush buffer and read stdin",                                    // AL is a function # (0x01, 0x06, 0x07, 0x08, or 0x0A)
        0x0D: "disk reset",
        0x0E: "select default drive %DL",                                       // returns # of available drives in AL
        0x0F: "open file using FCB ^%DS:%DX",                                   // DS:DX -> unopened File Control Block
        0x10: "close file using FCB ^%DS:%DX",
        0x11: "find first matching file using FCB ^%DS:%DX",
        0x12: "find next matching file using FCB ^%DS:%DX",
        0x13: "delete file using FCB ^%DS:%DX",
        0x14: "sequential read from file using FCB ^%DS:%DX",
        0x15: "sequential write to file using FCB ^%DS:%DX",
        0x16: "create or truncate file using FCB ^%DS:%DX",
        0x17: "rename file using FCB ^%DS:%DX",
        0x19: "get current default drive (AL)",
        0x1A: "set disk transfer area (DTA=%DS:%DX)",
        0x1B: "get allocation information for default drive",
        0x1C: "get allocation information for specific drive %DL",
        0x1F: "get drive parameter block for default drive",
        0x21: "read random record from file using FCB ^%DS:%DX",
        0x22: "write random record to file using FCB ^%DS:%DX",
        0x23: "get file size using FCB ^%DS:%DX",
        0x24: "set random record number for FCB ^%DS:%DX",
        0x25: "set address %DS:%DX of interrupt vector %AL",
        0x26: "create new PSP at segment %DX",
        0x27: "random block read from file using FCB ^%DS:%DX",
        0x28: "random block write to file using FCB ^%DS:%DX",
        0x29: "parse filename $%DS:%SI into FCB %ES:%DI using %AL",
        0x2A: "get system date (year=CX, mon=DH, day=DL)",
        0x2B: "set system date (year=%CX, mon=%DH, day=%DL)",
        0x2C: "get system time (hour=CH, min=CL, sec=DH, 100ths=DL)",
        0x2D: "set system time (hour=%CH, min=%CL, sec=%DH, 100ths=%DL)",
        0x2E: "set verify flag %AL",
        0x2F: "get disk transfer area (DTA=ES:BX)",                             // DOS 2.00+
        0x30: "get DOS version (AL=major, AH=minor)",
        0x31: "terminate and stay resident",
        0x32: "get drive parameter block (DPB=DS:BX) for drive %DL",
        0x33: "extended break check",
        0x34: "get address (ES:BX) of InDOS flag",
        0x35: "get address (ES:BX) of interrupt vector %AL",
        0x36: "get free disk space of drive %DL",
        0x37: "get(0)/set(1) switch character %DL (%AL)",
        0x38: "get country-specific information",
        0x39: "create subdirectory $%DS:%DX",
        0x3A: "remove subdirectory $%DS:%DX",
        0x3B: "set current directory $%DS:%DX",
        0x3C: "create or truncate file $%DS:%DX with attributes %CX",
        0x3D: "open file $%DS:%DX with mode %AL",
        0x3E: "close file %BX",
        0x3F: "read %CX bytes from file %BX into buffer %DS:%DX",
        0x40: "write %CX bytes to file %BX from buffer %DS:%DX",
        0x41: "delete file $%DS:%DX",
        0x42: "set position %CX:%DX of file %BX relative to %AL",
        0x43: "get(0)/set(1) attributes %CX of file $%DS:%DX (%AL)",
        0x44: "get device information (IOCTL)",
        0x45: "duplicate file handle %BX",
        0x46: "force file handle %CX to duplicate file handle %BX",
        0x47: "get current directory (DS:SI) for drive %DL",
        0x48: "allocate memory segment with %BX paragraphs",
        0x49: "free memory segment %ES",
        0x4A: "resize memory segment %ES to %BX paragraphs",
        0x4B: "load program $%DS:%DX using parameter block %ES:%BX",
        0x4C: "terminate with return code %AL",
        0x4D: "get return code (AL)",
        0x4E: "find first matching file $%DS:%DX with attributes %CX",
        0x4F: "find next matching file",
        0x50: "set current PSP %BX",
        0x51: "get current PSP (bx)",
        0x52: "get system variables (ES:BX)",
        0x53: "translate BPB %DS:%SI to DPB (ES:BP)",
        0x54: "get verify flag (AL)",
        0x55: "create child PSP at segment %DX",
        0x56: "rename file $%DS:%DX to $%ES:%DI",
        0x57: "get(0)/set(1) file %BX date %DX and time %CX (%AL)",
        0x58: "get(0)/set(1) memory allocation strategy (%AL)",                 // DOS 2.11+
        0x59: "get extended error information",                                 // DOS 3.00+
        0x5A: "create temporary file $%DS:%DX with attributes %CX",             // DOS 3.00+
        0x5B: "create file $%DS:%DX with attributes %CX",                       // DOS 3.00+ (doesn't truncate existing files like 0x3C)
        0x5C: "lock(0)/unlock(1) file %BX region %CX:%DX length %SI:%DI (%AL)", // DOS 3.00+
        0x5D: "critical error information (%AL)",                               // DOS 3.00+ (undocumented)
        0x60: "get fully-qualified filename from $%DS:%SI",                     // DOS 3.00+ (undocumented)
        0x63: "get lead byte table (%AL)",                                      // DOS 2.25 and 3.20+
        0x6C: "extended open file $%DS:%SI"                                     // DOS 4.00+
    };
    Interrupts.FUNCS[Interrupts.WINDBG.VECTOR] = {
        0x004F: "check debugger loaded"         // WINDBG.IS_LOADED returns WINDBG.LOADED (0xF386) if debugger loaded
    };
}

/*
 * DOS function reference (from https://sites.google.com/site/pcdosretro/dosfuncs)
 *
 *      INT 20 Program terminate (1.0+)
 *      Entry: CS=PSP
 *      Exit:  Does not return to caller
 *
 *      INT 21 Execute DOS function
 *      00 Program terminate (1.0+)
 *         Entry: CS=PSP
 *         Exit:  Does not return to caller
 *      01 Character input (1.0+)
 *         Entry: None
 *         Exit:  AL=character
 *      02 Character output (1.0+)
 *         Entry: DL=character
 *         Exit:  None
 *      03 Auxiliary input (1.0+)
 *         Entry: None
 *         Exit:  AL=character
 *      04 Auxiliary output (1.0+)
 *         Entry: DL=character
 *         Exit:  None
 *      05 Printer output (1.0+)
 *         Entry: DL=character
 *         Exit:  None
 *      06 Direct console I/O (1.0+)
 *         Entry: DL=FF for console input
 *                DL=character for console output
 *         Exit:  ZF=0 if a character is ready, AL=character
 *                ZF=1 if no character is ready
 *      07 Direct console input without echo (1.0+)
 *         Entry: None
 *         Exit:  AL=character
 *      08 Console input without echo (1.0+)
 *         Entry: None
 *         Exit:  AL=character
 *      09 Display string (1.0+)
 *         Entry: DS:DX-&gt;string ending with $
 *         Exit:  None
 *      0A Buffered keyboard input (1.0+)
 *         Entry: DS:DX-&gt;input buffer (first byte of buffer=maximum input length)
 *         Exit:  second byte of buffer=actual input length
 *      0B Get input status (1.0+)
 *         Entry: None
 *         Exit:  AL=00 no character available
 *                AL=FF character available
 *      0C Flush input buffer and input (1.0+)
 *         Entry: AL=function number (01,06,07,08,or 0A otherwise flush only)
 *                DS:DX-&gt;input buffer if function 0A
 *         Exit:  AL=character unless function 0A
 *      0D Disk reset (1.0+)
 *         Entry: None
 *         Exit:  None
 *      0E Set default drive (1.0+)
 *         Entry: DL=drive code (0=A)
 *         Exit:  AL=number of logical drives
 *      0F Open file (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB
 *         Exit:  AL=00 file opened
 *                AL=FF file not found
 *      10 Close file (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  AL=00 file closed
 *                AL=FF file not found
 *      11 Find first file (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB
 *         Exit:  AL=00 matching filename found
 *                      buffer at DTA receives an unopened FCB and directory entry
 *                      original FCB contents:
 *                      FCB    search drive code (1=A)
 *                      FCB+1  specified filespec
 *                      FCB+12 search attribute byte
 *                      FCB+13 directory entry offset
 *                      FCB+15 directory cluster (0=root)
 *                      FCB+17 unused
 *                      FCB+21 actual drive code (1=A)
 *                AL=FF matching filename not found
 *         Note:  The file's directory entry is returned after the FCB drive code.
 *                If a character device is found then the directory attribute byte
 *                is set to 40h.
 *      12 Find next file (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB from previous 11 or 12 call
 *         Exit:  AL=00 matching filename found
 *                      buffer at DTA receives an unopened FCB and directory entry
 *                AL=FF matching filename not found
 *         Note:  The file's directory entry is returned after the FCB drive code.
 *      13 Delete file (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB
 *         Exit:  AL=00 file deleted
 *                AL=FF matching filename not found or files are read-only
 *      14 Sequential read (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  AL=00 file was read
 *                AL=01 EOF (no data read)
 *                AL=02 segment wrap
 *                AL=03 EOF (partial read)
 *      15 Sequential write (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  AL=00 file was written
 *                AL=01 disk full
 *                AL=02 segment wrap
 *      16 Create or truncate file (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB
 *         Exit:  AL=00 file created
 *                AL=FF directory full
 *      17 Rename file (1.0+)
 *         Entry: DS:DX-&gt;rename FCB (FCB+11h-&gt;new filename)
 *         Exit:  AL=00 file renamed
 *                AL=FF no matching files found or new filename already exists
 *      18 Reserved
 *      19 Get default drive (1.0+)
 *         Entry: None
 *         Exit:  AL=drive code (0=A)
 *      1A Set disk transfer address (1.0+)
 *         Entry: DS:DX=new DTA
 *         Exit:  None
 *      1B Get allocation info for default drive (1.0+)
 *         Entry: None
 *         Exit:  AL=sectors per cluster
 *                CX=bytes per sector
 *                DX=clusters per drive
 *                DS:BX-&gt;media descriptor byte
 *                AL=FF invalid drive
 *      1C Get allocation info for specified drive (1.1+)
 *         Entry: DL=drive code (0=default)
 *         Exit:  Same as function 1B
 *      1D Reserved
 *      1E Reserved
 *      1F Get disk parameter block for default drive (1.1+)
 *         Entry: None
 *         Exit:  AL=00 drive valid
 *                DS:BX-&gt;disk parameter block
 *                   0 drive code (0=A)             13 maximum cluster number
 *                   1 unit code                    15 sectors per FAT
 *                   2 bytes per sector             17 first directory sector
 *                   4 sectors per cluster-1        19 pointer to device driver
 *                   5 cluster shift factor         23 media descriptor byte
 *                   6 first FAT sector             24 access flag (0=accessed)
 *                   8 number of FATs               25 pointer to next DPB
 *                   9 number of directory entries  29 last cluster allocated
 *                  11 first data sector            31 free clusters (-1=unknown)
 *                AL=FF drive invalid
 *         Note:  (3.x) The sectors per FAT field is one byte and all following
 *                fields are moved back one byte.
 *      20 Reserved
 *      21 Random read (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  AL=00 file was read
 *                AL=01 EOF (no data read)
 *                AL=02 segment wrap
 *                AL=03 EOF (partial read)
 *      22 Random write (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  AL=00 file was written
 *                AL=01 disk full
 *                AL=02 segment wrap
 *      23 Get file size in records (1.0+)
 *         Entry: DS:DX-&gt;unopened FCB
 *         Exit:  AL=00 random record field is set by dividing the file size by the
 *                      specified record size
 *                AL=FF file not found
 *      24 Set random record number (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *         Exit:  random record field is set based on record size, current record,
 *                and current block
 *      25 Set interrupt vector (1.0+)
 *         Entry: DS:DX=new address
 *                AL=interrupt number
 *         Exit:  None
 *      26 Create PSP (1.0+)
 *         Entry: CS=PSP
 *                DX=segment for new PSP
 *         Exit:  None
 *      27 Random block read (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *                CX=number of records to read
 *         Exit:  AL=00 file was read
 *                AL=01 EOF (no data read)
 *                AL=02 segment wrap
 *                AL=03 EOF (partial read)
 *                CX=actual number of records read
 *      28 Random block write (1.0+)
 *         Entry: DS:DX-&gt;opened FCB
 *                CX=number of records to write
 *         Exit:  AL=00 file was written
 *                AL=01 disk full
 *                AL=02 segment wrap
 *                CX=actual number of records written
 *      29 Parse filename (1.0+)
 *         Entry: DS:SI-&gt;string to parse
 *                ES:DI-&gt;buffer for unopened FCB
 *                AL=flags
 *                   Bit 0 1=ignore leading separators
 *                       1 1=modify FCB drive code byte only if a drive is specified
 *                       2 1=modify FCB filename only if a filename is specified
 *                       3 1=modify FCB extension only if an extension is specified
 *         Exit:  DS:SI-&gt;first character after parsed filename
 *                AL=00 no wildcard characters in string
 *                AL=01 wildcard characters in string
 *                AL=FF invalid drive
 *      2A Get date (1.0+)
 *         Entry: None
 *         Exit:  AL=weekday (0=Sunday)
 *                CX=year
 *                DH=month
 *                DL=day
 *      2B Set date (1.0+)
 *         Entry: CX=year
 *                DH=month
 *                DL=day
 *         Exit:  AL=00 date set
 *                AL=FF invalid date
 *      2C Get time (1.0+)
 *         Entry: None
 *         Exit:  CH=hours
 *                CL=minutes
 *                DH=seconds
 *                DL=hundredths
 *      2D Set time (1.0+)
 *         Entry: CH=hours
 *                CL=minutes
 *                DH=seconds
 *                DL=hundredths
 *         Exit:  AL=00 time set
 *                AL=FF invalid time
 *      2E Set verify flag (1.1+)
 *         Entry: AL=verify flag (0=off,1=on)
 *         Exit:  None
 *      2F Get disk transfer address (2.0+)
 *         Entry: None
 *         Exit:  ES:BX=DTA
 *      30 Get DOS version (2.0+)
 *         Entry: AL=0 return OEM number (5.0+)
 *                AL=1 return version flag (5.0+)
 *         Exit:  AL=major version number
 *                AH=minor version number
 *                BH=OEM number or version flag (00=RAM,08=ROM)
 *                BL:CX=24-bit serial number or 0
 *      31 Terminate and stay resident (2.0+)
 *         Entry: AL=return code
 *                DX=memory size in paragraphs (minimum 6)
 *         Exit:  Does not return to caller
 *      32 Get disk parameter block for specified drive (2.0+)
 *         Entry: DL=drive code (0=default)
 *         Exit:  Same as function 1F
 *      33 Get or set Ctrl-Break (2.0+)
 *         Entry: AL=0 get break
 *                AL=1 set break
 *                AL=2 swap break (*) (3.1+)
 *                AL=5 get boot drive (4.0+)
 *                AL=6 get DOS version (5.0+)
 *                DL=break flag if set or swap (0=off,1=on)
 *         Exit:  if function 00 or 02:
 *                   DL=break flag
 *                if function 05:
 *                   DL=boot drive code (1=A)
 *                if function 06:
 *                   BL=major version
 *                   BH=minor version
 *                   DL=revision (0=A)
 *                   DH=version flag (00=low,08=ROM,10=HMA)
 *      34 Get InDOS flag pointer (2.0+)
 *         Entry: None
 *         Exit:  ES:BX-&gt;InDOS flag
 *         Note:  The DOS critical error flag immediately precedes this byte.
 *      35 Get interrupt vector (2.0+)
 *         Entry: AL=interrupt number
 *         Exit:  ES:BX=interrupt address
 *      36 Get free disk space (2.0+)
 *         Entry: DL=drive code (0=default)
 *         Exit:  AX=sectors per cluster
 *                BX=free clusters
 *                CX=bytes per sector
 *                DX=clusters per drive
 *                AX=FFFF if drive invalid
 *      37 Get or set switch character (*) (2.0+)
 *         Entry: AL=0 get switch character
 *                AL=1 set switch character
 *                DL=switch character if set
 *         Exit:  DL=switch character if get
 *         Note:  (5.0+) Function 3701 has been disabled.
 *      38 Get or set country info (2.0+)
 *         Entry: AL=country code (0=default)
 *                BX=country code if AL=FF (3.0+)
 *                DX=FFFF if set request (2.11+)
 *                DS:DX-&gt;buffer if get request
 *         Exit:  CF=0 BX=country code if get request (3.0+)
 *                     buffer format:
 *                      0 date format (0=USA,1=Europe,2=Japan)
 *                      2 currency symbol string
 *                      7 thousands separator
 *                      9 decimal separator
 *                     11 date separator
 *                     13 time separator
 *                     15 currency format
 *                        0 symbol before amount, no space between
 *                        1 symbol after amount, no space between
 *                        2 symbol before amount, 1 space between
 *                        3 symbol after amount, 1 space between
 *                        4 symbol replaces decimal separator
 *                     16 digits after decimal in currency
 *                     17 time format (0=12-hour,1=24-hour)
 *                     18 case map call address
 *                     22 data list separator
 *                     24 reserved (10 bytes)
 *                CF=1 AX=error code
 *      39 Create directory (2.0+)
 *         Entry: DS:DX-&gt;directory name
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      3A Remove directory (2.0+)
 *         Entry: DS:DX-&gt;directory name
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      3B Change current directory (2.0+)
 *         Entry: DS:DX-&gt;directory name
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      3C Create or truncate file (2.0+)
 *         Entry: DS:DX-&gt;filename
 *                CX=file attributes
 *         Exit:  CF=0 AX=file handle
 *                CF=1 AX=error code
 *      3D Open file (2.0+)
 *         Entry: DS:DX-&gt;filename
 *                AL=open mode
 *                   Bit 0-2 access mode
 *                           000=read
 *                           001=write
 *                           010=read/write
 *                       4-6 sharing mode (3.0+)
 *                           000=compatibility
 *                           001=deny read/write access
 *                           010=deny write access
 *                           011=deny read access
 *                           100=deny none access
 *                         7 inheritance flag
 *                           0=file inherited by EXECed programs
 *                           1=file not inherited by EXECed programs
 *         Exit:  CF=0 AX=file handle
 *                CF=1 AX=error code
 *      3E Close file (2.0+)
 *         Entry: BX=file handle
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      3F Read file or device (2.0+)
 *         Entry: BX=file handle
 *                CX=bytes to read
 *                DS:DX-&gt;input buffer
 *         Exit:  CF=0 AX=number of bytes read (0=EOF)
 *                CF=1 AX=error code
 *      40 Write file or device (2.0+)
 *         Entry: BX=file handle
 *                CX=bytes to write (0=truncate file)
 *                DS:DX-&gt;output buffer
 *         Exit:  CF=0 AX=number of bytes written (0=disk full)
 *                CF=1 AX=error code
 *      41 Delete file (2.0+)
 *         Entry: DS:DX-&gt;filename
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      42 Move file pointer (2.0+)
 *         Entry: AL=code (0=absolute,1=relative,2=relative to EOF)
 *                BX=file handle
 *                CX:DX=offset
 *         Exit:  CF=0 DX:AX=new pointer
 *                CF=1 AX=error code
 *      43 Get or set file attributes (2.0+)
 *         Entry: AL=0 get attributes
 *                AL=1 set attributes
 *                CX=file attributes if set
 *                   Bit 0 1=read-only
 *                       1 1=hidden
 *                       2 1=system
 *                       4 1=directory (get only)
 *                       5 1=archive
 *                DS:DX-&gt;filename
 *         Exit:  CF=0 CX=file attributes if get
 *                CF=1 AX=error code
 *      44 I/O control for devices (2.0+)
 *         Notes: 1) Functions 02-05 work only if bit 14 of the device driver
 *                   attribute word is set.
 *                2) Function 08 works only if bit 11 of the device driver
 *                   attribute word is set.
 *                3) Functions 0C-0F work only if bit 6 of the device driver
 *                   attribute word is set.
 *                4) Functions 10-11 work only if bit 7 of the device driver
 *                   attribute word is set.
 *         00 Get device attributes (2.0+)
 *            Entry: BX=file handle
 *            Exit:  CF=0 DX=device attributes
 *                        Character devices:
 *                        Bit 0 1=console input
 *                            1 1=console output
 *                            2 1=NUL device
 *                            3 1=CLOCK device
 *                            4 1=INT 29 output (CON)
 *                            5 0=ASCII,1=binary
 *                            6 0=EOF on input
 *                            7 1=character device
 *                           11 1=open/close supported
 *                           13 1=output until busy supported
 *                           14 1=IOCTL supported
 *                        Block devices:
 *                        Bit 0-5 drive code (0=A)
 *                              6 0=file has been written
 *                              7 0=block device
 *                   CF=1 AX=error code
 *         01 Set device attributes (2.0+)
 *            Entry: BX=file handle (character devices only)
 *                   DX=device attributes (DH must be 0)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         02 Read from character device (2.0+)
 *         03 Write to character device (2.0+)
 *            Entry: BX=file handle
 *                   CX=number of bytes
 *                   DS:DX-&gt;buffer
 *            Exit:  CF=0 AX=number of bytes transferred
 *                   CF=1 AX=error code
 *         04 Read from block device (2.0+)
 *         05 Write to block device (2.0+)
 *            Entry: BL=drive code (0=default)
 *                   CX=number of bytes
 *                   DS:DX-&gt;buffer
 *            Exit:  CF=0 AX=number of bytes transferred
 *                   CF=1 AX=error code
 *         06 Get input status (2.0+)
 *         07 Get output status (2.0+)
 *            Entry: BX=file handle
 *            Exit:  CF=0 AL=status (00=not ready,FF=ready)
 *                   CF=1 AX=error code
 *         08 Removable media check (3.0+)
 *            Entry: BL=drive code (0=default)
 *            Exit:  CF=0 AX=value (0=removable,1=fixed)
 *                   CF=1 AX=error code
 *         09 Local/remote drive check (3.0+)
 *            Entry: BL=drive code (0=default)
 *            Exit:  CF=0 DX=device attributes
 *                        Bit 1 1=32-bit sectors supported
 *                            6 1=generic IOCTL calls supported
 *                            7 1=query IOCTL call supported
 *                            9 1=shared drive; direct I/O not allowed
 *                           11 1=removable media call supported
 *                           12 1=remote drive
 *                           13 1=media descriptor in FAT required
 *                           14 1=IOCTL calls supported
 *                           15 1=SUBSTed
 *                   CF=1 AX=error code
 *         0A Local/remote handle check (3.0+)
 *            Entry: BX=file handle
 *            Exit:  CF=0 DX=device attributes from SFT
 *                        Character devices:
 *                        Bit 0 1=console input
 *                            1 1=console output
 *                            2 1=NUL device
 *                            3 1=CLOCK device
 *                            4 1=INT 29 output (CON)
 *                            5 0=ASCII,1=binary
 *                            6 0=EOF on input
 *                            7 1=character device
 *                           11 1=network spooler
 *                           12 1=no inherit
 *                           13 1=named pipe
 *                           15 1=remote
 *                        Block devices:
 *                        Bit 0-5 drive code (0=A)
 *                              6 0=file has been written
 *                              7 0=block device
 *                             12 1=no inherit
 *                             14 1=date/time set
 *                             15 1=remote
 *                   CF=1 AX=error code
 *         0B Change sharing retry count (3.0+)
 *            Entry: CX=delay loop count
 *                   DX=retry count
 *            Exit:  None
 *         0C Generic IOCTL for handles (3.2+)
 *            Entry: BX=file handle
 *                   CH=category code (01=AUX,03=CON,05=PRN)
 *                   CL=function code
 *                      45 set printer retry count
 *                      4A set code page (3.3+)
 *                      4C prepare start (3.3+)
 *                      4D prepare end (3.3+)
 *                      5F set display info (4.0+)
 *                      65 get printer retry count
 *                      6A get code page (3.3+)
 *                      6B get prepare list (3.3+)
 *                      7F get display info (4.0+)
 *                   DS:DX-&gt;parameter block or retry count word
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *            Get/set code page and prepare end parameter block format:
 *               0 length (2)
 *               2 code page
 *            Prepare start parameter block format:
 *               0 flags (device specific)
 *               2 data length
 *               4 number of code pages
 *               6 code pages (-1=perform a refresh operation)
 *            Get prepare list parameter block format:
 *               0 data length
 *               2 number of hardware code pages
 *               4 hardware code pages
 *               n number of prepared code pages
 *             n+2 prepared code pages
 *            Display info parameter block format:
 *               0 info level (must be 0)
 *               1 reserved
 *               2 data length (14)
 *               4 flags
 *                 Bit 0 (0=blink,1=intensity)
 *               6 mode (1=text,2=graphics)
 *               7 reserved
 *               8 colors
 *              10 pixel columns
 *              12 pixel rows
 *              14 character columns
 *              16 character rows
 *         0D Generic IOCTL for drives (3.2+)
 *            Entry: BL=drive code (0=default)
 *                   CH=category code (08=disk)
 *                   CL=function code
 *                      40 set device parameters
 *                      41 write track
 *                      42 format track
 *                      46 set media info (4.0+)
 *                      47 set access flag (4.0+)
 *                      60 get device parameters
 *                      61 read track
 *                      62 verify track
 *                      66 get media info (4.0+)
 *                      67 get access flag (4.0+)
 *                      68 sense media type (5.0+)
 *                   DS:DX-&gt;parameter block
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *            Get/set device parameter block format:
 *               0 flags (only bit 0 is used by get)
 *                 Bit 0 0=return default BPB/build new BPB
 *                       1=return build BPB/use device BPB
 *                     1 0=read all fields
 *                       1=read track layout only
 *                     2 0=sector sizes vary
 *                       1=sector sizes equal
 *               1 drive type
 *                 0=360K             5=fixed
 *                 1=1.2M             6=tape
 *                 2=720K             7=1.44M
 *                 3=8" single sided  8=read/write optical
 *                 4=8" double sided  9=2.88M
 *               2 attributes
 *                 Bit 0 1=non-removable
 *                     1 1=changeline supported
 *               4 cylinders
 *               6 density (0=high,1=double)
 *               7 BIOS parameter block
 *              32 reserved
 *              38 track layout count
 *              40 track layout words (sector number,sector size)
 *              Note: Track layout fields are used by set only.
 *            Read/write parameter block format:
 *               0 reserved
 *               1 head
 *               3 cylinder
 *               5 sector
 *               7 number of sectors
 *               9 buffer address
 *            Format/verify parameter block format:
 *               0 reserved
 *               1 head
 *               3 cylinder
 *            Get/set media info parameter block format:
 *               0 info level (must be 0)
 *               2 volume serial number
 *               6 volume label
 *              17 8-byte file system type
 *            Get/set access flag parameter block format:
 *               0 reserved
 *               1 access flag (0=disallow disk access,1=allow disk access)
 *            Sense media type parameter block format:
 *               0 media type flag (0=other,1=default)
 *               1 media type (2=720K,7=1.44M,9=2.88M)
 *         0E Get logical drive map (3.2+)
 *         0F Set logical drive map (3.2+)
 *            Entry: BL=logical drive code (0=default)
 *            Exit:  CF=0 AL=physical drive code (0=only 1 logical drive mapped)
 *                   CF=1 AX=error code
 *         10 Query IOCTL for handles (5.0+)
 *            Entry: BX=file handle
 *                   CH=category code (01=AUX,03=CON,05=PRN)
 *                   CL=function code
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         11 Query IOCTL for drives (5.0+)
 *            Entry: BL=drive code (0=default)
 *                   CH=category code (08=disk)
 *                   CL=function code
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *      45 Duplicate handle (2.0+)
 *         Entry: BX=file handle
 *         Exit:  CF=0 AX=new file handle
 *                CF=1 AX=error code
 *      46 Redirect handle (2.0+)
 *         Entry: BX=file handle
 *                CX=file handle to redirect
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *         Note:  If the handle to redirect is opened then it is closed before
 *                being redirected.
 *      47 Get current directory (2.0+)
 *         Entry: DS:SI-&gt;64-byte buffer for pathname
 *                DL=drive code (0=default)
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      48 Allocate memory (2.0+)
 *         Entry: BX=number of paragraphs to allocate
 *         Exit:  CF=0 AX=segment of allocated block
 *                CF=1 AX=error code
 *                     BX=size of largest available block
 *      49 Release memory (2.0+)
 *         Entry: ES=segment of block to release
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      4A Reallocate memory (2.0+)
 *         Entry: BX=number of paragraphs to allocate
 *                ES=segment of block to reallocate
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *                     BX=size of largest available block
 *      4B Execute program (2.0+)
 *         Entry: AL=0 execute program
 *                AL=1 load program
 *                AL=3 load overlay
 *                AL=5 enter exec state (5.0+)
 *                DS:DX-&gt;filename or exec state parameter block
 *                ES:BX-&gt;parameter block (unused by enter exec state)
 *                   if function 00 or 01:
 *                      0 environment block segment or 0
 *                      2 command tail pointer
 *                      6 FCB1 pointer
 *                     10 FCB2 pointer
 *                   if function 03:
 *                      0 segment where file will be loaded
 *                      2 relocation factor
 *                   if function 05:
 *                      0 reserved
 *                      2 flags (0=COM,1=EXE,2=overlay)
 *                      4 program name pointer
 *                      8 PSP
 *                     10 program CS:IP
 *                     14 doubleword program size
 *         Exit:  CF=0 BX and DX may be destroyed
 *                     parameter block if load only:
 *                       14 SS:SP of loaded program
 *                       18 CS:IP of loaded program
 *                CF=1 AX=error code
 *         Note:  After calling function 4B01 the current PSP is set to that of
 *                the loaded program. Before executing the program, DS and ES
 *                should be set to the program's PSP and the INT 22 vector in the
 *                program's PSP should be set to a valid return address.
 *      4C Terminate with return code (2.0+)
 *         Entry: AL=return code
 *         Exit:  Does not return to caller
 *      4D Get program return code (2.0+)
 *         Entry: None
 *         Exit:  AL=return code
 *                AH=exit type (0=normal,1=Ctrl-C,2=critical error,3=TSR)
 *      4E Find first file (2.0+)
 *         Entry: DS:DX-&gt;filespec
 *                CX=file attributes
 *         Exit:  CF=0 DTA    search drive code (1=A)
 *                     DTA+1  search filespec
 *                     DTA+12 search attribute byte
 *                     DTA+13 directory entry offset
 *                     DTA+15 directory cluster (0=root)
 *                     DTA+17 unused
 *                     DTA+21 attribute byte (40h=character device)
 *                     DTA+22 file time
 *                     DTA+24 file date
 *                     DTA+26 file size
 *                     DTA+30 filename
 *                CF=1 AX=error code
 *      4F Find next file (2.0+)
 *         Entry: Bytes 0-20 of buffer at DTA must be set from previous 4E or 4F call
 *         Exit:  Same as function 4E
 *      50 Set current PSP (2.0+)
 *         Entry: BX=PSP segment
 *         Exit:  None
 *      51 Get current PSP (2.0+)
 *         Entry: None
 *         Exit:  BX=PSP segment
 *      52 Get DOS internal pointers (*) (2.0+)
 *         Entry: None
 *         Exit:  ES:BX-&gt;DOS internal pointers
 *                  -02h memory chain anchor
 *                  +00h pointer to disk parameter blocks
 *                  +04h pointer to system file tables
 *                  +08h pointer to CLOCK$ device header
 *                  +0Ch pointer to CON device header
 *                  +10h disk buffer size
 *                  +12h pointer to disk buffer chain (3.x)
 *                       pointer to disk buffer control block (4.0+)
 *                  +16h pointer to current directory structures
 *                  +1Ah pointer to FCB system file tables
 *                  +1Eh FCB keep count
 *                  +20h number of actual drives
 *                  +21h number of logical drives
 *                  +22h NUL device header
 *      53 Create disk parameter block (*) (2.0+)
 *         Entry: DS:SI-&gt;BIOS parameter block
 *                   0 bytes per sector
 *                   2 sectors per cluster
 *                   3 number of reserved sectors
 *                   5 number of FATs
 *                   6 number of root directory entries
 *                   8 total number of sectors
 *                  10 media descriptor byte
 *                  11 sectors per FAT
 *                  13 sectors per track
 *                  15 number of heads
 *                  17 number of hidden sectors
 *                  21 32-bit number of sectors if word at 8=0
 *                ES:BP-&gt;buffer for disk parameter block
 *         Exit:  None
 *      54 Get verify flag (2.0+)
 *         Entry: None
 *         Exit:  AL=verify flag (0=off,1=on)
 *      55 Create program PSP (*) (2.0+)
 *         Entry: DX=segment for new PSP
 *                SI=new end of allocation
 *         Exit:  None
 *         Note:  After calling function 55 the current PSP is set to the new PSP.
 *      56 Rename file (2.0+)
 *         Entry: DS:DX-&gt;old filename
 *                ES:DI-&gt;new filename
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *         Note:  This function can also rename a directory or move a file from
 *                one directory to another.
 *      57 Get or set file date and time (2.0+)
 *         Entry: AL=0 get date and time
 *                AL=1 set date and time
 *                BX=file handle
 *                CX=time if set
 *                   Bits 0-4 seconds/2 (0-29)
 *                       5-10 minutes (0-59)
 *                      11-15 hours (0-23)
 *                DX=date if set
 *                   Bits 0-4 day (1-31)
 *                        5-8 month (1-12)
 *                       9-15 year-1980
 *         Exit:  CF=0 CX=time if get
 *                     DX=date if get
 *                CF=1 AX=error code
 *      58 Get or set allocation strategy (2.11+)
 *         Entry: AL=0 get strategy
 *                AL=1 set strategy
 *                AL=2 get UMB link state (5.0+)
 *                AL=3 set UMB link state (5.0+)
 *                BX=strategy code or UMB link state (0=unlink,1=link)
 *                   00=first fit
 *                   01=best fit
 *                   02=last fit
 *                   40=first fit, high only (5.0+)
 *                   41=best fit, high only (5.0+)
 *                   42=last fit, high only (5.0+)
 *                   80=first fit, high first (5.0+)
 *                   81=best fit, high first (5.0+)
 *                   82=last fit, high first (5.0+)
 *         Exit:  CF=0 AX=strategy code or UMB link state if get
 *                CF=1 AX=error code
 *      59 Get extended error info (3.0+)
 *         Entry: None
 *         Exit:  AX=extended error code
 *                BH=error class
 *                BL=suggested action
 *                CH=locus
 *                ES:DI-&gt;volume label for invalid disk change error or 0
 *      5A Create unique file (3.0+)
 *         Entry: DS:DX-&gt;pathname ending with \
 *                CX=file attributes
 *         Exit:  CF=0 AX=file handle (filename is appended to pathname)
 *                CF=1 AX=error code
 *      5B Create new file (3.0+)
 *         Entry: DS:DX-&gt;filename
 *                CX=file attributes
 *         Exit:  CF=0 AX=file handle
 *                CF=1 AX=error code
 *      5C Lock or unlock file (3.0+)
 *         Entry: AL=0 lock
 *                AL=1 unlock
 *                BX=file handle
 *                CX:DX=region offset
 *                SI:DI=region length
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *         Note:  File sharing (SHARE.EXE) must be loaded to use this function.
 *      5D File sharing functions (*) (3.0+)
 *         Notes: 1) Some functions use a parameter block with the following format:
 *                   AX,BX,CX,DX,SI,DI,DS,ES,reserved,machine #,process (PSP)
 *                2) Functions 02-05 work only if file sharing (SHARE.EXE) is loaded.
 *                3) Functions 07-09 work only if the redirector (REDIR.EXE) is loaded.
 *         00 Server DOS call (*) (3.0+)
 *            Entry: DS:DX-&gt;parameter block (AX,BX,CX,DX,SI,DI,DS,ES,machine #,process)
 *            Exit:  Depends on called function
 *         01 Commit all local files (*) (3.0+)
 *            Entry: None
 *            Exit:  None
 *         02 Close all occurences of file (*) (3.0+)
 *            Entry: DS:DX-&gt;parameter block (DS:DX-&gt;qualified filespec)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         03 Close all files for machine (*) (3.0+)
 *            Entry: DS:DX-&gt;parameter block (machine #)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         04 Close all files for machine and process (*) (3.0+)
 *            Entry: DS:DX-&gt;parameter block (machine #,process)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         05 Get shared file info (*) (3.0+)
 *            Entry: DS:DX-&gt;parameter block (BX=share file table index,CX=SFT index)
 *            Exit:  CF=0 AX=device info from SFT
 *                        BX=machine #
 *                        CX=lock count
 *                        ES:DI-&gt;qualified filename
 *                   CF=1 AX=error code
 *         06 Get DOS swappable data area (*) (3.0+)
 *            Entry: None
 *            Exit:  DS:SI-&gt;DOS swappable data area
 *                   CX=DOS swappable data area length
 *                   DX=DOS critical data area length
 *            Note:  The first byte of the data area is the critical error flag.
 *         07 Get print stream state (*) (3.1+)
 *            Entry: None
 *            Exit:  DL=state (0=truncate off,1=truncate on)
 *         08 Set print stream state (*) (3.1+)
 *            Entry  DL=state (0=truncate off,1=truncate on)
 *            Exit:  None
 *         09 Truncate print stream (*) (3.1+)
 *            Entry  None
 *            Exit:  None
 *         0A Set extended error info (3.1+)
 *            Entry: DS:DX-&gt;parameter block (see function 59 for affected registers)
 *            Exit:  None
 *      5E Network functions (3.0+)
 *         Note: Functions 02-05 work only if the redirector (REDIR.EXE) is loaded.
 *         00 Get machine name (3.0+)
 *            Entry: DS:DX-&gt;buffer for machine name
 *            Exit:  CH=validity flag (0=invalid,1=valid)
 *                   CL=netbios number
 *         01 Set machine name (*) (3.0+)
 *            Entry: DS:DX-&gt;machine name
 *                   CH=validity flag (0=invalid,1=valid)
 *                   CL=netbios number
 *            Exit:  None
 *         02 Set printer string (3.1+)
 *            Entry: DS:SI-&gt;printer setup string
 *                   BX=redirection list index
 *                   CX=printer setup string length
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         03 Get printer string (3.1+)
 *            Entry: ES:DI-&gt;buffer for printer setup string
 *                   BX=redirection list index
 *            Exit:  CF=0 CX=printer setup string length
 *                   CF=1 AX=error code
 *         04 Set print mode (*) (3.1+)
 *            Entry: BX=redirection list index
 *                   DX=print mode (0=text,1=binary)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         05 Get print mode (*) (3.1+)
 *            Entry: BX=redirection list index
 *            Exit:  CF=0 DX=print mode (0=text,1=binary)
 *                   CF=1 AX=error code
 *      5F Network redirection functions (3.1+)
 *         Notes: 1) Functions 00-05 work only if the redirector (REDIR.EXE) is loaded.
 *                2) Functions 07-08 work only on builtin drives.
 *         00 Get redirection mode (*) (3.1+)
 *            Entry: BL=device type (3=printer,4=disk)
 *            Exit:  CF=0 BH=redirection mode (0=off,1=on)
 *                   CF=1 AX=error code
 *         01 Set redirection mode (*) (3.1+)
 *            Entry: BL=device type (3=printer,4=disk)
 *                   BH=redirection mode (0=off,1=on)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         02 Get redirection list entry (3.1+)
 *            Entry: DS:SI-&gt;16-byte buffer for local device name
 *                   ES:DI-&gt;128-byte buffer for remote device name
 *                   BX=redirection list index
 *            Exit:  CF=0 BH=status (0=valid,1=invalid)
 *                        BL=device type (3=printer,4=disk)
 *                        CX=user word
 *                   CF=1 AX=error code
 *         03 Set redirection list entry (3.1+)
 *            Entry: DS:SI-&gt;local device name
 *                   ES:DI-&gt;remote device name
 *                   BL=device type (3=printer,4=disk)
 *                   CX=user word
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         04 Cancel redirection list entry (3.1+)
 *            Entry: DS:SI-&gt;local device name
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         05 Get redirection list entry extended (*) (4.0+)
 *            Entry: DS:SI-&gt;16-byte buffer for local device name
 *                   ES:DI-&gt;128-byte buffer for remote device name
 *                   BX=redirection list index
 *            Exit:  CF=0 BH=status (0=valid,1=invalid)
 *                        BL=device type (3=printer,4=disk)
 *                        CX=user word
 *                        BP=netbios session number
 *                   CF=1 AX=error code
 *         07 Enable drive (*) (4.0+)
 *            Entry: DL=drive code (0=default)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *         08 Disable drive (*) (4.0+)
 *            Entry: DL=drive code (0=default)
 *            Exit:  CF=0 None
 *                   CF=1 AX=error code
 *      60 Qualify filename (*) (3.0+)
 *         Entry: DS:SI-&gt;filespec
 *                ES:DI-&gt;buffer for qualified filespec
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      61 Reserved
 *      62 Get current PSP (3.0+)
 *         Entry: None
 *         Exit:  BX=PSP segment
 *      63 Get DBCS lead byte table pointer (*) (3.0+)
 *         Entry: AL must be 0
 *         Exit:  DS:SI-&gt;DBCS lead byte table
 *      64 Set wait for external event flag (*) (3.2+)
 *         Entry: AL=flag (0=enable,&gt;0=disable)
 *         Exit:  None
 *         Note:  This function affects the PC Convertible only.
 *                If enabled and the default console driver is being used then
 *                INT 15 function 41 is issued while waiting for console input
 *                during functions 01,08,0A,and 3F.
 *      65 Get extended country info (3.3+)
 *         Entry: AL=01 get extended country info
 *                   02 get country uppercase table
 *                   03 get country lowercase table (reserved until 6.2)
 *                   04 get country filename uppercase table
 *                   05 get country filename character table
 *                   06 get country collating table
 *                   07 get DBCS vector table (4.0+)
 *                   20 uppercase character (4.0+)
 *                   21 uppercase string (4.0+)
 *                   22 uppercase ASCIIZ string (4.0+)
 *                   23 yes/no check (*) (4.0+)
 *                   A0 uppercase filename character (*) (4.0+)
 *                   A1 uppercase filename string (*) (4.0+)
 *                   A2 uppercase filename ASCIIZ string (*) (4.0+)
 *                   A3 yes/no check (*) (4.0+)
 *                if function 01-07:
 *                   BX=code page (-1=active code page)
 *                   CX=length to return (must be at least 5)
 *                   DX=country code (-1=default)
 *                   ES:DI-&gt;return buffer
 *                if function 20,23,A0,A3:
 *                   DL=character
 *                if function 21,A1:
 *                   DS:DX-&gt;string
 *                   CX=string length
 *                if function 22,A2:
 *                   DS:DX-&gt;string
 *         Exit:  CF=0 CX=data length if function 01-07
 *                     DL=character if function 20
 *                     AX=code if function 23,A3 (0=no,1=yes,2=neither)
 *                CF=1 AX=error code
 *                buffer format if function 01:
 *                 0 info ID
 *                 1 length
 *                 3 country code
 *                 5 code page
 *                 7 country info (same format as function 38)
 *                buffer format if function 02-07:
 *                 0 info ID
 *                 1 pointer to requested table (word length followed by data)
 *      66 Get or set code page (3.3+)
 *         Entry: AL=1 get code page
 *                AL=2 set code page
 *                BX=active code page if set
 *         Exit:  CF=0 BX=active code page if get
 *                     DX=default code page if get
 *                CF=1 AX=error code
 *      67 Set handle count (3.3+)
 *         Entry: BX=handle count
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      68 Commit file (3.3+)
 *         Entry: BX=file handle
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      69 Get or set media info (*) (4.0+)
 *         Entry: AL=0 get media info
 *                AL=1 set media info
 *                BL=drive code (0=default)
 *                DS:DX-&gt;media info
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *         Media info format:
 *            0 info level (must be 0)
 *            2 volume serial number
 *            6 volume label
 *           17 8-byte file system type
 *      6A Commit file (*) (4.0+)
 *         Entry: Same as function 68
 *         Exit:  Same as function 68
 *      6B Reserved
 *      6C Extended open/create file (4.0+)
 *         Entry: DS:SI-&gt;filename
 *                BX=open mode
 *                   Bit 0-2 access mode
 *                           000=read
 *                           001=write
 *                           010=read/write
 *                       4-6 sharing mode
 *                           000=compatibility
 *                           001=deny read/write access
 *                           010=deny write access
 *                           011=deny read access
 *                           100=deny none access
 *                         7 inheritance flag
 *                           0=file inherited by EXECed programs
 *                           1=file not inherited by EXECed programs
 *                        13 critical error handling
 *                           0=execute INT 24
 *                           1=return error code
 *                        14 buffering
 *                           0=buffer writes
 *                           1=don't buffer writes
 *                CX=file attributes
 *                DX=open flags
 *                   Bit 0-3 0000=fail if exists
 *                           0001=open if exists
 *                           0010=truncate if exists
 *                       4-7 0000=fail if doesn't exist
 *                           0001=create if doesn't exist
 *         Exit:  CF=0 AX=file handle
 *                     CX=action code (1=file opened,2=file created,3=file truncated)
 *                CF=1 AX=error code
 *
 *      INT 22 Terminate address (1.0+)
 *             This is the address that DOS returns to after program termination.
 *             It is set during execute program (function 4B) processing.
 *
 *      INT 23 Ctrl-Break handler address (1.0+)
 *             This routine is entered when Ctrl-Break is detected by DOS.
 *             On entry the registers are set to the values they had at the start
 *             of the interrupted function call. Control may be returned via
 *             IRET or FAR RET, if FAR RET is used and the carry flag is set
 *             then the program is aborted otherwise the function is restarted.
 *      Note:  Any DOS function may be issued from an INT 23 handler.
 *
 *      INT 24 Critical error handler address (1.0+)
 *      Entry: AH=error indicator
 *                Bit 0 0=read error
 *                      1=write error
 *                  1-2 disk area
 *                      00=DOS area
 *                      01=FAT
 *                      10=directory
 *                      11=data area
 *                    3 1=fail allowed
 *                    4 1=retry allowed
 *                    5 1=ignore allowed
 *                    7 0=block device error
 *                      1=character device error
 *             AL=drive code (0=A)
 *             DI=error code (lower half of DI)
 *                00=write-protect error           07=unknown media type
 *                01=unknown unit                  08=sector not found
 *                02=drive not ready               09=printer out of paper
 *                03=unknown command               0A=write fault
 *                04=data error (CRC)              0B=read fault
 *                05=bad request structure length  0C=general failure
 *                06=seek error                    0F=invalid disk change
 *             BP:SI=pointer to device driver header
 *      Exit:  Control may be returned to DOS via IRET with an action code in AL
 *                0=ignore error (fail if ignore is unallowed)
 *                1=retry function (fail if retry is unallowed)
 *                2=abort program
 *                3=fail system call (abort if fail is unallowed)
 *             Control may be returned directly to the program by removing the
 *             INT 24 registers (IP,CS,flags) from the stack, restoring the
 *             program's registers (AX,BX,CX,DX,SI,DI,BP,DS,ES) and issuing
 *             an IRET. This will leave DOS in an unstable state because the
 *             critical error flag is set until a DOS function other than 01-0C,
 *             33,50,51,59,62,or 64 is issued.
 *      Note:  Only DOS functions 01-0C,33,50,51,59,62,or 64 should be issued from
 *             an INT 24 handler.
 *
 *      INT 25 Absolute disk read (1.0+)
 *      Entry: AL=drive number (0=A)
 *             CX=number of sectors or -1 if &gt;32M partition
 *             DX=starting sector number
 *             DS:BX-&gt;data buffer or parameter block
 *               parameter block (3.31+)
 *                 0 starting sector number
 *                 4 number of sectors
 *                 6 data buffer
 *      Exit:  CF=0 None
 *             CF=1 AH=error code
 *                     01=bad command
 *                     02=bad address mark
 *                     03=write-protect error
 *                     04=sector not found
 *                     08=DMA overrun
 *                     10=data error (bad CRC)
 *                     20=controller error
 *                     40=seek error
 *                     80=timed-out
 *                  AL=device error code (same as lower byte of DI for INT 24)
 *      Notes: 1) The CPU flags are still on the stack after an INT 25 or INT 26.
 *             2) All registers except the segment registers and SP may be destroyed.
 *
 *      INT 26 Absolute disk write (1.0+)
 *      Entry: Same as INT 25
 *      Exit:  Same as INT 25
 *
 *      INT 27 Terminate and stay resident (1.0+)
 *      Entry: CS=PSP
 *             DX=number of bytes to stay resident (minimum 96)
 *      Exit:  Does not return to caller
 *
 *      INT 28 Idle handler (2.0+)
 *             This interrupt is issued by DOS during functions 01-0C to indicate
 *             that a TSR program may safely issue a non-character I/O DOS
 *             function even though the InDOS flag is not zero.
 *             DOS functions 01-0C should not be issued from a INT 28 handler
 *             unless the critical error flag is set first.
 *
 *      INT 29 Character output (2.0+)
 *      Entry: AL=character
 *      Exit:  None
 *      Note:  This interrupt is called for character output if the console
 *             device has bit 4 in the device attribute word set.
 *
 *      INT 2A Network/critical section (*) (3.0+)
 *      00 Network installation check (3.0+)
 *         Entry: None
 *         Exit:  AH=00 not installed
 *                AH=FF installed
 *      01 Execute NETBIOS request with no error retry (*) (3.0+)
 *         Entry: ES:BX-&gt;network control block
 *         Exit:  AH=0 no error
 *                AH=1 AL=error code
 *      02 Set network printer parameters (*) (3.0+)
 *         Entry: DS:SI-&gt;16-byte buffer for local device name
 *                BX=characters per line (-1=use current)
 *                CX=lines per inch (-1=use current)
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      03 Check direct I/O (3.0+)
 *         Entry: DS:SI-&gt;ASCIIZ disk name (d:)
 *         Exit:  CF=0 direct I/O allowed
 *                CF=1 direct I/O not allowed
 *      04 Execute NETBIOS request (3.0+)
 *         Entry: AL=error retry flag (0=retry,1=no retry)
 *                ES:BX-&gt;network control block
 *         Exit:  AH=0 no error
 *                AH=1 AL=error code
 *      05 Get network resource information (3.0+)
 *         Entry: None
 *         Exit:  BX=available network name count
 *                CX=available network control block count
 *                DX=available network session count
 *      06 Network print stream control (3.0+)
 *         Entry: AL=mode (1=concatenation,2=truncation,3=truncate stream)
 *         Exit:  CF=0 None
 *                CF=1 AX=error code
 *      80 Begin critical section (*) (3.0+)
 *         Entry: AL=critical section number
 *         Exit:  None
 *      81 End critical section (*) (3.0+)
 *         Entry: AL=critical section number
 *         Exit:  None
 *      82 End all critical sections (*) (3.0+)
 *         Entry: None
 *         Exit:  None
 *      84 Keyboard idle loop (*) (3.0+)
 *         Entry: None
 *         Exit:  None
 *
 *      INT 2E Execute command (*) (2.0+)
 *      Entry: DS:SI-&gt;command string-1 followed by a carriage return
 *      Exit:  All registers except CS and IP are destroyed
 *      Note:  This function is not re-enterant and should not be issued from a
 *             batch file.
 *
 *      INT 2F Multiplex (3.0+)
 *      Entry: AH=program identifier
 *             AL=function code
 *             Other registers depend on the function
 *      Exit:  Depends on the function
 *
 *      Program identifier codes:
 *      01 Print queueing (PRINT) (3.0+)
 *      02 Network printer control (REDIR) (3.1+)
 *      05 Network error message lookup (REDIR) (3.0+)
 *      06 ASSIGN (3.1+)
 *      08 IBMBIO drive services (used by DRIVER.SYS) (3.2+)
 *      10 File sharing (SHARE) (3.0+)
 *      11 Redirector services (REDIR and MSCDEX) (3.0+)
 *      12 DOS internal services (used by REDIR and MSCDEX) (3.0+)
 *      13 Swap INT 13 vector (3.2+)
 *      14 NLS support (NLSFUNC) (3.3+)
 *      15 CD-ROM extensions (MSCDEX)
 *      16 Windows services
 *      17 Windows clipboard services
 *      1A ANSI.SYS (4.0+)
 *      43 XMS services (HIMEM.SYS)
 *      46 Windows support
 *      48 DOSKEY (5.0+)
 *      4A DOS services (HMA, RPL), SMARTDRV (5.0+)
 *      53 POWER (APM events broadcast) (5.02+)
 *      54 POWER (main API) (5.02+)
 *      55 COMMAND.COM (5.0+)
 *      56 INTERLNK (5.02+)
 *      AC GRAPHICS (5.0+)
 *      AD DISPLAY.SYS, KEYB (3.3+)
 *      AE Installable command support (APPEND) (3.3+)
 *      B0 GRAFTABL (3.3+)
 *      B7 APPEND (3.2+)
 *
 *      DOS extended error information:
 *
 *      Extended error code:                    Error class:
 *      01 Invalid function number              01 Out of resource
 *      02 File not found                       02 Temporary situation
 *      03 Path not found                       03 Authorization error
 *      04 Too many open files                  04 Internal DOS error
 *      05 Access denied                        05 Hardware failure
 *      06 Invalid handle                       06 System software failure
 *      07 Memory control blocks destroyed      07 Application program error
 *      08 Insufficient memory                  08 Not found
 *      09 Invalid memory block address         09 Invalid format
 *      0A Invalid environment                  0A File locked
 *      0B Invalid format                       0B Media error
 *      0C Invalid access code                  0C Already exists
 *      0D Invalid data                         0D Unknown
 *      0E Reserved
 *      0F Invalid drive                        Suggested action:
 *      10 Attempt to remove current directory  01 Retry
 *      11 Not same device                      02 Delay and retry
 *      12 No more files                        03 Get corrected user input
 *      13 Write-protect error                  04 Exit with cleanup
 *      14 Unknown unit                         05 Exit without cleanup
 *      15 Drive not ready                      06 Ignore error
 *      16 Unknown command                      07 Retry after user intervention
 *      17 Data error (CRC)
 *      18 Bad request structure length         Error locus:
 *      19 Seek error                           01 Unknown
 *      1A Unknown medium type                  02 Block device error
 *      1B Sector not found                     03 Network error
 *      1C Printer out of paper                 04 Character device error
 *      1D Write fault                          05 Memory error
 *      1E Read fault
 *      1F General failure
 *      20 Sharing violation
 *      21 Lock violation
 *      22 Invalid disk change
 *      23 FCB unavailable
 *      24 Sharing buffer overflow
 *      25 Code page mismatch (4.0+)
 *      26 Out of input (4.0+)
 *      27 Insufficient disk space (4.0+)
 *      32 Function not supported
 *      41 Network access denied
 *      50 File exists
 *      51 Reserved
 *      52 Cannot make directory entry
 *      53 Fail on INT 24
 *
 * DOS table and structure reference (from https://sites.google.com/site/pcdosretro/dostables)
 *
 *      Program Segment Prefix (100h bytes)
 *      00 INT 20
 *      02 End of allocation segment
 *      04 Reserved
 *      05 Far call to DOS
 *      0A Saved INT 22 vector
 *      0E Saved INT 23 vector
 *      12 Saved INT 24 vector (1.1+)
 *      16 Caller PSP segment (2.0+)
 *      18 File table (2.0+)
 *      2C Environment segment (2.0+)
 *      2E Stack pointer after last DOS call (2.0+)
 *      32 File table size (3.0+)
 *      34 Pointer to file table (3.0+)
 *      38 Pointer to next PSP (SHARE only) (3.0+)
 *      3C Reserved
 *      40 DOS version (4.0+)
 *      42 Reserved
 *      50 INT 21,RETF (2.0+)
 *      53 Reserved
 *      5C FCB 1
 *      6C FCB 2
 *      7C Unused
 *      80 Command tail
 *
 *      File Control Block (25h bytes)
 *      00 Drive code (1=A)
 *      01 Filename
 *      09 Extension
 *      0C Current block number
 *      0E Record size
 *      10 File size
 *      14 Date
 *      16 Time
 *      18 Reserved
 *      20 Current record number
 *      21 Random record number
 *
 *      Extended FCB (2Ch bytes)
 *      00 FF (Extended FCB indicator)
 *      01 Reserved
 *      06 Attribute byte
 *      07 Standard FCB
 *
 *      Disk partition table entry (10h bytes)
 *      00 Status (00=non-bootable,80=bootable)
 *      01 Starting head
 *      02 Starting cylinder and sector (INT 13 format)
 *      04 Type (0=unknown,1=FAT12,4=FAT16,5=extended,6=BIGDOS)
 *      05 Ending head
 *      06 Ending cylinder and sector (INT 13 format)
 *      08 Starting absolute sector
 *      0C Number of sectors
 *      Note: There are 4 entries starting at offset 1BE
 *
 *      Disk boot sector (200h bytes)
 *      00 Jump to boot code
 *      03 OEM name
 *      0B Bytes per sector
 *      0D Sectors per cluster
 *      0E Number of reserved sectors
 *      10 Number of FATs
 *      11 Number of root directory entries
 *      13 Total number of sectors
 *      15 Media descriptor byte
 *         F0 1.44M (2 sides,18 sectors/track,80 tracks)
 *            2.88M (2 sides,36 sectors/track,80 tracks)
 *         F8 fixed disk
 *         F9 720K (2 sides,9 sectors/track,80 tracks)
 *            1.2M (2 sides,15 sectors/track,80 tracks)
 *         FC 180K (1 side,9 sectors/track,40 tracks)
 *         FD 360K (2 sides,9 sectors/track,40 tracks)
 *         FE 160K (1 side,8 sectors/track,40 tracks)
 *         FF 320K (2 sides,8 sectors/track,40 tracks)
 *      16 Sectors per FAT
 *      18 Sectors per track
 *      1A Number of heads
 *      1C Number of hidden sectors
 *      20 32-bit number of sectors if word at 13=0 (3.31+)
 *      24 Drive number (4.0+)
 *      25 Reserved (4.0+)
 *      26 Extended boot record ID (29) (4.0+)
 *      27 Serial number (4.0+)
 *      2B Volume label (4.0+)
 *      36 8-byte file system name (4.0+)
 *      Note: Bytes 0B-23 are the BIOS parameter block
 *
 *      Directory entry (20h bytes)
 *      00 Filename
 *      08 Extension
 *      0B Attribute byte
 *         01=Read-only
 *         02=Hidden
 *         04=System
 *         08=Volume label (2.0+)
 *         10=Directory (2.0+)
 *         20=Archive (2.0+)
 *      0C Reserved
 *      16 Time
 *         Bits 0-4 Seconds/2 (0-29)
 *             5-10 Minutes (0-59)
 *            11-15 Hours (0-23)
 *      18 Date
 *         Bits 0-4 Day (1-31)
 *              5-8 Month (1-12)
 *             9-15 Year-1980
 *      1A Starting cluster number
 *      1C File size
 *
 *      Disk parameter block (20h bytes in 3.x, 21h bytes in 4.0+)
 *      00 Drive code (0=A)
 *      01 Unit code
 *      02 Bytes per sector
 *      04 Sectors per cluster-1
 *      05 Cluster shift factor (2**n sectors per cluster)
 *      06 First FAT sector
 *      08 Number of FATs
 *      09 Number of directory entries
 *      0B First data sector
 *      0D Maximum cluster number
 *      0F Sectors per FAT
 *      11 First directory sector
 *      13 Pointer to device driver
 *      17 Media descriptor byte
 *      18 Access flag (00=accessed,FF=not accessed)
 *      19 Pointer to next DPB
 *      1D Last cluster allocated
 *      1F Number of free clusters (-1 if unknown)
 *      Note: (3.x) The sectors per FAT field is one byte and all following
 *            fields are moved back one byte.
 *
 *      System file table (35h bytes in 3.x, 3Bh bytes in 4.0+)
 *      00 Open count
 *      02 Open mode
 *         Bit 0-2 access mode
 *                 000=read
 *                 001=write
 *                 010=read/write
 *             4-6 sharing mode
 *                 000=compatibility
 *                 001=deny read/write
 *                 010=deny write
 *                 011=deny read
 *                 100=deny none
 *              13 critical error handling
 *                 0=execute INT 24
 *                 1=return error code
 *              14 buffering
 *                 0=buffer writes
 *                 1=don't buffer writes
 *              15 1=FCB SFT
 *      04 Attribute byte
 *      05 Device info
 *         Character devices:          Block devices:
 *         Bit 0 1=console input       Bit 0-5 drive code (0=A)
 *             1 1=console output            6 0=file has been written
 *             2 1=NUL device                7 0=block device
 *             3 1=CLOCK device             12 1=no inherit
 *             4 1=INT 29 output (CON)      14 1=date/time set
 *             5 0=ASCII,1=binary           15 1=redirected file
 *             6 0=EOF on input
 *             7 1=character device
 *            11 1=network spooler
 *            12 1=no inherit
 *            13 1=named pipe
 *            15 1=redirected device
 *      07 Pointer to device driver or disk parameter block
 *      0B First cluster number
 *      0D Time
 *      0F Date
 *      11 File size
 *      15 File pointer
 *      19 Current relative cluster number
 *      1B 32-bit directory entry sector (4.0+)
 *      1B Current absolute cluster number (3.x)
 *      1D Directory entry sector (3.x)
 *      1F Directory entry position in sector
 *      20 Filename
 *      28 Extension
 *      2B Pointer to next SFT for the same file (SHARE only)
 *      2F Machine number
 *      31 PSP of owner
 *      33 SHARE file table offset
 *      35 Current absolute cluster number (4.0+)
 *      37 Reserved (4.0+)
 *
 *      SHARE file table
 *      00 Entry flag (1=open,0=unused,-1=end of list)
 *      01 Entry length
 *      03 Filespec checksum
 *      04 First lock table offset
 *      06 Pointer to system file table
 *      0A SHARE file number
 *      0C Filespec
 *
 *      SHARE lock table (10h bytes)
 *      00 Offset to next lock table for file
 *      02 Start of lock region
 *      06 End of lock region
 *      0A Pointer to system file table
 *      0E PSP of owner
 *
 *      Current directory structure (51h bytes in 3.x, 58h bytes in 4.0+)
 *      00 Current directory
 *      43 Drive type
 *         1000=SUBSTed drive
 *         2000=JOINed drive
 *         4000=valid drive
 *         8000=redirected drive
 *      45 Pointer to disk parameter block
 *      49 Cluster number of current directory (0=root)
 *      4B Reserved
 *      4F Length of root directory name starting at offset 0
 *      51 Reserved (4.0+)
 *
 *      Disk buffer header (10h bytes) (3.x)
 *      00 Pointer to next buffer
 *      04 Drive code (0=A,FF=unused)
 *      05 Flags
 *         Bit 0 reserved
 *             1 1=FAT sector
 *             2 1=directory sector
 *             3 1=data sector
 *             4 reserved
 *             5 1=buffer read
 *             6 1=buffer written
 *             7 reserved
 *      06 Sector number
 *      08 Number of FATs (if FAT) or 1
 *      09 Sectors per FAT (if FAT) or 0
 *      0A Pointer to DPB
 *      0E Reserved
 *      10 Buffered sector
 *
 *      Disk buffer header (14h bytes) (4.0+)
 *      00 Pointer to next buffer
 *      02 Pointer to previous buffer
 *      04 Drive code (0=A,FF=unused)
 *      05 Flags
 *         Bit 0 reserved
 *             1 1=FAT sector
 *             2 1=directory sector
 *             3 1=data sector
 *             4 reserved
 *             5 1=buffer read (4.0)
 *             6 1=buffer written
 *             7 reserved
 *      06 Sector number
 *      0A Number of FATs (if FAT) or 1
 *      0B Sectors per FAT (if FAT) or 0
 *      0D Pointer to DPB
 *      11 Reserved
 *      14 Buffered sector
 *
 *      Disk buffer control block (4.0)
 *      00 Pointer to buffer chain array
 *      04 Number of chains
 *      06 Pointer to sector lookahead buffers
 *      0A Number of sector lookahead buffers
 *      0C Unknown
 *
 *      Disk buffer control block (5.0+)
 *      00 Pointer to buffer chain
 *      04 Number of modified buffers
 *      06 Pointer to sector lookahead buffers
 *      0A Number of sector lookahead buffers
 *      0C HMA flag (1=buffers in HMA)
 *      0D Pointer to HMA transfer buffer
 *
 *      Disk buffer chain array entry (8 bytes) (4.0)
 *      00 Reserved
 *      02 Pointer to last accessed buffer
 *      06 Number of modified buffers
 *      07 Reserved
 *
 *      Stacks block header (12h bytes)
 *      00 Reserved
 *      02 Number of stacks
 *      04 Offset of stacks
 *      06 Stack size
 *      08 Pointer to stacks table (descriptors followed by stacks)
 *      0C Offset of first stacks descriptor
 *      0E Offset of last stacks descriptor
 *      10 Offset of current stacks descriptor
 *
 *      Stacks descriptor (8 bytes)
 *      00 Flag (0=free,1=in use)
 *      02 Savearea for SS:SP
 *      06 Offset of end of stack
 *
 *      Device driver header (12h bytes)
 *      00 Pointer to next device driver or -1
 *      04 Attribute word
 *         Bit 0 1=console input
 *             1 1=console output (character devices)
 *               1=32-bit sectors supported (block devices) (3.31+)
 *             2 1=NUL device
 *             3 1=CLOCK device
 *             4 1=INT 29 output (CON)
 *             6 1=extended functions supported (13,17,18) (3.2+)
 *             7 1=query IOCTL function supported (19) (5.0+)
 *            11 1=open/close/removable media supported (3.0+)
 *            13 1=output until busy supported (character devices) (3.0+)
 *               1=media descriptor in FAT required (block devices)
 *            14 1=IOCTL supported
 *            15 0=block device
 *               1=character device
 *      06 Strategy address
 *      08 Interrupt address
 *      0A Device name or number of units
 *
 *      Device driver request header (common fields)
 *      00 Request header length
 *      01 Unit number
 *      02 Command code
 *         00=Init                   0B=Flush output buffers
 *         01=Media check            0C=I/O control write
 *         02=Build BPB              0D=Open (3.0+)
 *         03=I/O control read       0E=Close (3.0+)
 *         04=Read                   0F=Removable media check (3.0+)
 *         05=Non-destructive read   10=Output until busy (3.0+)
 *         06=Input status           13=Generic I/O control (3.2+)
 *         07=Flush input buffers    17=Get drive map (3.2+)
 *         08=Write                  18=Set drive map (3.2+)
 *         09=Write with verify      19=Query I/O control (5.0+)
 *         0A=Output status
 *      03 Return status word
 *         Bit 0-7 if error
 *                 00=write-protect error  07=unknown medium
 *                 01=unknown unit         08=sector not found
 *                 02=drive not ready      09=printer out of paper
 *                 03=unknown command      0A=write fault
 *                 04=data error (CRC)     0B=read fault
 *                 05=bad request length   0C=general failure
 *                 06=seek error           0F=invalid disk change
 *               8 1=done
 *               9 1=busy
 *              15 1=error
 *      05 Reserved (8 bytes)
 *
 *      Device driver request headers:
 *      Init
 *      00 Common (length=17h in 3.x, 19h in 4.0+)
 *      0D Number of units (set by driver)
 *      0E End of available memory (5.0+)
 *         End of resident code (set by driver)
 *      12 Pointer to string after DEVICE=
 *         BPB array pointer (set by driver)
 *      16 Drive code of first unit (0=A)
 *      17 Error message flag (1=display message) (4.0+)
 *
 *      Media check
 *      00 Common (length=13h)
 *      0D Media descriptor byte
 *      0E Status (set by driver: 1=unchanged,0=unknown,-1=changed)
 *      0F Pointer to previous disk label (set by driver if disk changed)
 *
 *      Build BPB
 *      00 Common (length=16h)
 *      0D Media descriptor byte
 *      0E Pointer to sector buffer
 *      12 Pointer to BPB (set by driver)
 *      Note: The sector buffer contains the first sector of the FAT if bit 13 in the
 *            device attribute word is zero otherwise it may be used as scratch space.
 *
 *      IOCTL read, Read, Write, Write with verify, IOCTL write, Output until busy
 *      00 Common (length=14h)
 *      0D Unused
 *      0E Pointer to data buffer
 *      12 Byte count (set by driver to number of bytes transferred)
 *      Notes: 1) The IOCTL functions are called only if bit 14 in the device
 *                attribute word is set.
 *             2) The output until busy function is called only if bit 13 in the
 *                device attribute word is set.
 *
 *      Read, Write, Write with verify
 *      00 Common (length=16h-1Eh)
 *      0D Media descriptor byte
 *      0E Pointer to data buffer
 *      12 Sector count (set by driver to number of sectors transferred)
 *      14 Starting sector number (-1=if 32-bit sectors)
 *      16 Pointer to previous disk label (set by driver if error 0F)
 *      1A 32-bit starting sector number
 *      Note: The 32-bit starting sector number is used only if bit 1 in the
 *            device attribute word is set.
 *
 *      Non-destructive read
 *      00 Common (length=0Eh)
 *      0D Character (set by driver)
 *      Note: This function sets the busy bit (bit 9) in the request header
 *            if no character is ready.
 *
 *      Input status, Output status
 *      00 Common (length=0Dh)
 *      Note: These functions set the busy bit (bit 9) in the request header
 *            to indicate device status.
 *
 *      Flush input buffers, Flush output buffers
 *      00 Common (length=0Dh)
 *
 *      Open, Close, Removable media check
 *      00 Common (length=0Dh)
 *      Notes: 1) These functions are called only if bit 11 in the device
 *                attribute word is set.
 *             2) The removable media check function sets bit 9 in the status word
 *                if the device is non-removable.
 *
 *      Generic IOCTL, Query IOCTL
 *      00 Common (length=17h)
 *      0D Category code
 *      0E Function code
 *      0F Unused
 *      13 Parameter buffer pointer
 *      Notes: 1) The Generic IOCTL function is called only if bit 6 in the device
 *                attribute word is set.
 *             2) The Query IOCTL function is called only if bit 7 in the device
 *                attribute word is set.
 *
 *      Get drive map, Set drive map
 *      00 Common (length=0Dh)
 *      Notes: 1) These functions are called only if bit 6 in the device
 *                attribute word is set.
 *             2) These functions set the unit field (byte 1) in the request
 *                header to the physical drive code.
 *
 *      Clock device info (6 bytes)
 *      00 Days since 1/1/80
 *      02 Minutes
 *      03 Hours
 *      04 Hundredths
 *      05 Seconds
 *
 *      Memory Control Block (10h bytes)
 *      00 Type ('M' or 'Z' if last)
 *      01 PSP segment of owner (0=free,8=DOS)
 *      03 Size (paragraphs)
 *      05 Unused
 *      08 Program name (4.0+)
 *
 *      EXE file header
 *      00 'MZ'
 *      02 Size of last page
 *      04 File size in 512-byte pages
 *      06 Relocation table count
 *      08 Header size (paragraphs)
 *      0A Minimum allocation (paragraphs)
 *      0C Maximum allocation (paragraphs)
 *      0E Initial SS
 *      10 Initial SP
 *      12 Checksum
 *      14 Initial IP
 *      16 Initial CS
 *      18 Offset of relocation table
 *         Table entry format:
 *         0 offset of relocation
 *         2 segment of relocation
 *      1A Overlay number
 *
 *      EXEPACK header
 *      00 Actual IP
 *      02 Actual CS
 *      04 0 (set to PSP+10h by unpack code)
 *      06 Unpack code and data size (including relocation table)
 *      08 Actual SP
 *      0A Actual SS
 *      0C Actual code and data size
 *
 *      Note: If an EXE file is packed then CS:IP-2 points to 'RB' and CS:0
 *            points to the EXEPACK header, this is followed by the unpack code
 *            and a relocation table containing a word count and relocation
 *            entries for 16 segments.
 */

if (typeof module !== 'undefined') module.exports = Interrupts;
