import Link from 'next/link'

function index() {
    return (
        <ul>
            <li>
                <Link href="/ButtonTesting">
                    <a>Button Testing</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/FirstView">
                    <a>Static: First View</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/HomeView">
                    <a>Static: Home View</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/Guesses">
                    <a>Static: Guess View</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="https://github.com/jesssullivan/tmpui-merlinai/">
                    <a>@Github</a>
                </Link>
            </li>
        </ul>
    )
}

export default index