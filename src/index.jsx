import Link from 'next/link'
import React from 'react';
import ReactDOM from 'react-dom';

function index() {
    return (
        <ul>
            <br/>
            <li>
                <Link href="/CropBoxTesting">
                    <a>Crop Box Testing</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/CropButtonTesting">
                    <a>Crop Button Testing</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/StaticFirstView">
                    <a>Static: First View</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/StaticHomeView">
                    <a>Static: Home View</a>
                </Link>
            </li>
            <br/>
            <li>
                <Link href="/StaticGuesses">
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