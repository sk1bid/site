from factorio_rcon import RCONClient
import re
import sys


def main():
    if len(sys.argv) != 4:
        print("-1")
        sys.exit(1)

    host, port_str, password = sys.argv[1:4]

    try:
        port = int(port_str)
    except ValueError:
        print("-1")
        sys.exit(1)

    try:
        with RCONClient(host, port, password) as client:
            response = client.send_command("/players online")
    except Exception:
        print("-1")
        sys.exit(1)

    match = re.search(r"Online players\s*\((\d+)\)", response)
    if not match:
        print("-1")
        sys.exit(1)

    print(match.group(1))


if __name__ == "__main__":
    main()
